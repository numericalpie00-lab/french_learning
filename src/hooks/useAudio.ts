import { useCallback, useEffect, useRef, useState } from 'react'

export interface AudioControls {
  /** 正在播放 */
  isPlaying: boolean
  /** 已开始过播放（暂停中仍为 true，播完/切换后复位） */
  hasStarted: boolean
  /** 播放进度 0-1 */
  progress: number
  /** 当前播放位置（秒），用于字幕时间戳匹配 */
  currentTime: number
  /** 时长（秒），加载完成前为 0 */
  duration: number
  /** 音频加载/播放失败（如文件缺失） */
  error: boolean
  toggle: () => void
  /** 跳转到指定进度 0-1 */
  seek: (fraction: number) => void
}

/** 管理单个音频的播放状态；url 变化时自动重建并停止上一段 */
export function useAudio(url: string): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = new Audio(url)
    audio.preload = 'metadata'
    audioRef.current = audio

    const onTime = () => {
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
      setCurrentTime(audio.currentTime)
    }
    const onLoaded = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      setIsPlaying(false)
      setHasStarted(false)
      setProgress(0)
      setCurrentTime(0)
    }
    const onError = () => {
      setError(true)
      setIsPlaying(false)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    setIsPlaying(false)
    setHasStarted(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    setError(false)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audioRef.current = null
    }
  }, [url])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
          setHasStarted(true)
        })
        .catch(() => setError(true))
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    audio.currentTime = Math.min(Math.max(fraction, 0), 1) * audio.duration
    setProgress(fraction)
    setCurrentTime(audio.currentTime)
  }, [])

  return { isPlaying, hasStarted, progress, currentTime, duration, error, toggle, seek }
}
