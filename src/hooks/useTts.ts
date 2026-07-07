import { useCallback, useEffect, useRef, useState } from 'react'

export interface TtsControls {
  /** 浏览器是否暴露 SpeechSynthesis API */
  supported: boolean
  isSpeaking: boolean
  /** 正在朗读的句子下标，未朗读时为 -1 */
  activeIndex: number
  /** 无可用语音引擎或朗读失败 */
  error: boolean
  /** 从第 fromIndex 句开始朗读（默认从头） */
  speak: (fromIndex?: number) => void
  stop: () => void
  toggle: () => void
}

/**
 * 浏览器原生 SpeechSynthesis 零成本 TTS：逐句排队朗读一组句子，
 * 每句的 onstart 事件驱动 activeIndex，供卡拉OK高亮联动。
 */
export function useTts(sentences: string[], langTag = 'fr-FR'): TtsControls {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const watchdogRef = useRef<number | null>(null)

  // fr-FR 优先，其次任意 fr-* 音色；Chrome 的 getVoices 异步就绪，需监听 voiceschanged
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    const pick = () => {
      const voices = synth.getVoices()
      const norm = (l: string) => l.replace('_', '-').toLowerCase()
      voiceRef.current =
        voices.find((v) => norm(v.lang) === langTag.toLowerCase()) ??
        voices.find((v) => norm(v.lang).startsWith(langTag.slice(0, 2).toLowerCase())) ??
        null
    }
    pick()
    synth.addEventListener?.('voiceschanged', pick)
    return () => synth.removeEventListener?.('voiceschanged', pick)
  }, [supported, langTag])

  const clearWatchdog = () => {
    if (watchdogRef.current !== null) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    clearWatchdog()
    setIsSpeaking(false)
    setActiveIndex(-1)
  }, [supported])

  const speak = useCallback(
    (fromIndex = 0) => {
      if (!supported) {
        setError(true)
        return
      }
      const synth = window.speechSynthesis
      synth.cancel()
      clearWatchdog()
      setError(false)
      let started = false
      const slice = sentences.slice(fromIndex)
      slice.forEach((text, i) => {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = langTag
        if (voiceRef.current) u.voice = voiceRef.current
        u.rate = 0.92 // 学习场景稍放慢
        u.onstart = () => {
          started = true
          clearWatchdog()
          setIsSpeaking(true)
          setActiveIndex(fromIndex + i)
        }
        if (i === slice.length - 1) {
          u.onend = () => {
            setIsSpeaking(false)
            setActiveIndex(-1)
          }
        }
        u.onerror = (e: SpeechSynthesisErrorEvent) => {
          // cancel()/切句会触发 interrupted，不算真错误
          if (e.error === 'interrupted' || e.error === 'canceled') return
          clearWatchdog()
          setIsSpeaking(false)
          setActiveIndex(-1)
          setError(true)
        }
        synth.speak(u)
      })
      // 平台无语音引擎时 onstart 永不触发：兜底标记不可用
      watchdogRef.current = window.setTimeout(() => {
        if (!started) {
          synth.cancel()
          setIsSpeaking(false)
          setError(true)
        }
      }, 2500)
    },
    [sentences, supported, langTag],
  )

  const toggle = useCallback(() => {
    if (isSpeaking) stop()
    else speak(0)
  }, [isSpeaking, speak, stop])

  // 句子列表变化或组件卸载时停止朗读
  useEffect(() => stop, [stop, sentences])

  return { supported, isSpeaking, activeIndex, error, speak, stop, toggle }
}
