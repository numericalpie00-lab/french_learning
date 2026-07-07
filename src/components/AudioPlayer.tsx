import { AnimatePresence, motion } from 'framer-motion'
import { AudioLines, Pause, Play, VolumeX } from 'lucide-react'
import { useAudio } from '../hooks/useAudio'
import type { AudioClip } from '../data/types'
import { useLangStore } from '../store/langStore'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface AudioPlayerProps {
  audio: AudioClip
}

/** 简洁播放器：Play/Pause + 进度条；播放时展示跟随全局语言切换的字幕 */
export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const lang = useLangStore((s) => s.lang)
  const { isPlaying, hasStarted, progress, duration, error, toggle, seek } =
    useAudio(audio.url)

  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-(--shadow-soft)">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-navy">
        <AudioLines className="h-3.5 w-3.5" />
        听一遍 · Écoutez
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          disabled={error}
          aria-label={isPlaying ? '暂停' : '播放'}
          className={
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-(--shadow-soft) transition-colors ' +
            (error
              ? 'cursor-not-allowed bg-sand text-ink-soft'
              : 'bg-terracotta text-parchment hover:bg-terracotta/90')
          }
        >
          {error ? (
            <VolumeX className="h-4 w-4" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </motion.button>

        <div className="min-w-0 flex-1">
          <div
            role="slider"
            aria-label="播放进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="group relative h-5 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              seek((e.clientX - rect.left) / rect.width)
            }}
          >
            <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-sand" />
            <motion.div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-terracotta"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] tabular-nums text-ink-soft">
            <span>{formatTime(progress * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-ink-soft">
          音频文件暂不可用（{audio.url}），字幕文本仍可在下方选择语言查看。
        </p>
      )}

      {/* 字幕联动：播放期间展示，随全局三档语言切换 */}
      <AnimatePresence>
        {(hasStarted || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-parchment px-4 py-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={lang}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className={
                    'text-sm leading-relaxed text-ink ' +
                    (lang === 'fr' ? 'italic' : '')
                  }
                >
                  {lang === 'fr'
                    ? `« ${audio.transcript.fr} »`
                    : audio.transcript[lang]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
