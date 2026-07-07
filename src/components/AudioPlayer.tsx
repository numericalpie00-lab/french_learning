import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AudioLines, Headphones, Pause, Play, Speech, Square, VolumeX } from 'lucide-react'
import { useAudio } from '../hooks/useAudio'
import { useTts } from '../hooks/useTts'
import type { AudioClip } from '../data/types'
import { useLangStore } from '../store/langStore'
import KaraokeTranscript from './KaraokeTranscript'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

type PlayMode = 'file' | 'tts'

interface AudioPlayerProps {
  audio: AudioClip
}

/**
 * 双模式播放器：
 * - 音频模式：播放录音文件，逐句高亮由时间戳驱动
 * - 朗读模式：SpeechSynthesis (fr-FR) 逐句 TTS，高亮由 onstart 事件驱动
 * 字幕文本跟随全局三档语言开关。
 */
export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const lang = useLangStore((s) => s.lang)
  const segments = audio.transcript
  const frSentences = useMemo(() => segments.map((s) => s.fr), [segments])
  const [mode, setMode] = useState<PlayMode>('file')

  const file = useAudio(audio.url)
  const tts = useTts(frSentences)

  const fileActiveIndex = file.hasStarted
    ? segments.findIndex((s) => file.currentTime >= s.start && file.currentTime < s.end)
    : -1
  const activeIndex = mode === 'file' ? fileActiveIndex : tts.activeIndex

  const isBusy = mode === 'file' ? file.isPlaying : tts.isSpeaking
  const modeError = mode === 'file' ? file.error : tts.error

  // 字幕一旦展开就保持可见（便于复读/点句重播），切换题目时复位
  const shouldReveal = file.hasStarted || tts.isSpeaking || modeError
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    if (shouldReveal) setRevealed(true)
  }, [shouldReveal])
  useEffect(() => {
    setRevealed(false)
  }, [audio.url])
  const showTranscript = revealed || shouldReveal

  const switchMode = (m: PlayMode) => {
    if (m === mode) return
    if (file.isPlaying) file.toggle()
    tts.stop()
    setMode(m)
  }

  const handleToggle = () => {
    if (mode === 'file') file.toggle()
    else tts.toggle()
  }

  const handleSelect = (i: number) => {
    if (mode === 'file') {
      if (file.duration) file.seek(segments[i].start / file.duration)
    } else {
      tts.speak(i)
    }
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-(--shadow-soft)">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-navy">
        <AudioLines className="h-3.5 w-3.5" />
        听一遍 · Écoutez
        {/* 播放源切换：录音 / TTS 朗读 */}
        <div className="ml-auto flex gap-1 rounded-full bg-sand p-0.5">
          <button
            onClick={() => switchMode('file')}
            title="播放录音文件"
            className={
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ' +
              (mode === 'file' ? 'bg-navy text-parchment' : 'text-ink-soft hover:text-navy')
            }
          >
            <Headphones className="h-3 w-3" />
            音频
          </button>
          <button
            onClick={() => switchMode('tts')}
            title="浏览器 TTS 朗读（SpeechSynthesis · fr-FR）"
            className={
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ' +
              (mode === 'tts' ? 'bg-navy text-parchment' : 'text-ink-soft hover:text-navy')
            }
          >
            <Speech className="h-3 w-3" />
            朗读
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleToggle}
          disabled={modeError}
          aria-label={isBusy ? (mode === 'file' ? '暂停' : '停止朗读') : '播放'}
          className={
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-(--shadow-soft) transition-colors ' +
            (modeError
              ? 'cursor-not-allowed bg-sand text-ink-soft'
              : 'bg-terracotta text-parchment hover:bg-terracotta/90')
          }
        >
          {modeError ? (
            <VolumeX className="h-4 w-4" />
          ) : !isBusy ? (
            <Play className="ml-0.5 h-4 w-4" />
          ) : mode === 'file' ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
        </motion.button>

        {mode === 'file' ? (
          <div className="min-w-0 flex-1">
            <div
              role="slider"
              aria-label="播放进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(file.progress * 100)}
              className="group relative h-5 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                file.seek((e.clientX - rect.left) / rect.width)
              }}
            >
              <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-sand" />
              <motion.div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-terracotta"
                style={{ width: `${file.progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] tabular-nums text-ink-soft">
              <span>{formatTime(file.progress * file.duration)}</span>
              <span>{formatTime(file.duration)}</span>
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-xs text-ink-soft">
            {tts.isSpeaking ? (
              <span className="font-medium text-navy">
                正在朗读第 {tts.activeIndex + 1} / {segments.length} 句
              </span>
            ) : (
              <span>SpeechSynthesis · fr-FR，点击播放逐句朗读，点击句子可从该句开始</span>
            )}
          </div>
        )}
      </div>

      {mode === 'file' && file.error && (
        <p className="mt-2 text-xs text-ink-soft">
          音频文件暂不可用（{audio.url}），可切换到「朗读」用浏览器 TTS 收听。
        </p>
      )}
      {mode === 'tts' && tts.error && (
        <p className="mt-2 text-xs text-ink-soft">
          当前浏览器没有可用的语音引擎，请切回「音频」模式。
        </p>
      )}

      {/* 卡拉OK字幕：逐句高亮 + 自动滚动，文本随全局语言开关切换 */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <KaraokeTranscript
              segments={segments}
              activeIndex={activeIndex}
              lang={lang}
              onSelect={handleSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
