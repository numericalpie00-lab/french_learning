import { motion } from 'framer-motion'
import { Anchor, Feather, MessagesSquare } from 'lucide-react'
import type { Lang } from '../data/types'
import { useLangStore } from '../store/langStore'

const modes: { key: Lang; short: string; full: string; icon: typeof Feather }[] = [
  { key: 'fr', short: 'FR', full: '纯法语沉浸', icon: Feather },
  { key: 'en', short: 'EN', full: '英文词源锚点', icon: Anchor },
  { key: 'zh', short: '中', full: '中文大白话逻辑', icon: MessagesSquare },
]

/** 全局三档语言切换开关（滑动胶囊样式） */
export default function LangToggle() {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)

  return (
    <div
      role="radiogroup"
      aria-label="语言模式"
      className="flex items-center gap-1 rounded-full border border-ink/10 bg-cream p-1 shadow-(--shadow-soft)"
    >
      {modes.map(({ key, short, full, icon: Icon }) => {
        const active = lang === key
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            title={full}
            onClick={() => setLang(key)}
            className={
              'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
              (active ? 'text-parchment' : 'text-ink-soft hover:text-navy')
            }
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-full bg-navy"
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">{short}</span>
            <span className="relative z-10 hidden xl:inline">{full}</span>
          </button>
        )
      })}
    </div>
  )
}
