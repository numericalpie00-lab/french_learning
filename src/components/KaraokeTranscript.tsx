import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Lang, TranscriptSegment } from '../data/types'

interface KaraokeTranscriptProps {
  segments: TranscriptSegment[]
  /** 当前朗读/播放到的句子下标，-1 表示无 */
  activeIndex: number
  lang: Lang
  /** 点击某句：录音模式跳转到该句时间戳，TTS 模式从该句开始朗读 */
  onSelect?: (index: number) => void
}

/** 卡拉OK式逐句字幕：当前句高亮 + 自动滚动，文本随全局语言开关切换 */
export default function KaraokeTranscript({
  segments,
  activeIndex,
  lang,
  onSelect,
}: KaraokeTranscriptProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIndex])

  return (
    <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-parchment px-2 py-2">
      {segments.map((seg, i) => {
        const active = i === activeIndex
        return (
          <button
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            onClick={() => onSelect?.(i)}
            className={
              'block w-full rounded-lg border-l-2 px-3 py-1.5 text-left text-sm leading-relaxed transition-all duration-200 ' +
              (active
                ? 'border-terracotta bg-sand/70 font-medium text-navy'
                : 'border-transparent text-ink-soft hover:bg-sand/40 hover:text-ink')
            }
          >
            <motion.span
              key={lang}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              className={lang === 'fr' ? 'italic' : ''}
            >
              {seg[lang]}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}
