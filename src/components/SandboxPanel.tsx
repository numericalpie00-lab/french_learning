import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AudioLines,
  BookOpenText,
  Check,
  Lightbulb,
  MessageCircleQuestion,
  Target,
  X,
} from 'lucide-react'
import type { TcfB2Item } from '../data/types'

interface SandboxPanelProps {
  item: TcfB2Item | null
}

type Lang = 'fr' | 'en_anchor' | 'zh_logic'

const langTabs: { key: Lang; label: string }[] = [
  { key: 'fr', label: 'FR 沉浸' },
  { key: 'en_anchor', label: 'EN 词源锚点' },
  { key: 'zh_logic', label: '中文逻辑' },
]

/** 沙盘演练区：直觉选择 → 三语解构 → 考点提炼 */
export default function SandboxPanel({ item }: SandboxPanelProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const [lang, setLang] = useState<Lang>('zh_logic')

  useEffect(() => {
    setPicked(null)
    setLang('zh_logic')
  }, [item?.id])

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-(--shadow-card)">
      <header className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
        <Target className="h-4 w-4 text-olive" />
        <h2 className="text-sm font-semibold tracking-wide text-navy">
          沙盘演练区 · Bac à sable
        </h2>
        {item && (
          <span className="ml-auto rounded-full bg-sand px-3 py-0.5 text-xs font-medium text-navy">
            {item.category}
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {!item ? (
          <p className="mt-16 text-center text-sm leading-relaxed text-ink-soft">
            在左侧图谱中点击一个场景卡片，
            <br />
            开始你的沉浸演练。
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* 场景 */}
              <div className="rounded-2xl bg-sand/60 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-terracotta">
                  <MessageCircleQuestion className="h-3.5 w-3.5" />
                  场景
                </div>
                <p className="text-sm leading-relaxed text-ink">{item.immersion_scenario}</p>
              </div>

              {/* 直觉选择 */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy">
                  <Lightbulb className="h-3.5 w-3.5" />
                  你的直觉是哪一句？
                </div>
                <div className="space-y-2">
                  {item.options.map((opt, i) => {
                    const revealed = picked !== null
                    const state = !revealed
                      ? 'idle'
                      : opt.is_best
                        ? 'best'
                        : i === picked
                          ? 'picked-wrong'
                          : 'muted'
                    return (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPicked(i)}
                        className={
                          'flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left text-sm leading-relaxed shadow-(--shadow-soft) transition-colors ' +
                          (state === 'idle'
                            ? 'border-ink/10 bg-cream hover:border-terracotta/50 hover:bg-parchment'
                            : state === 'best'
                              ? 'border-olive bg-olive/10 text-navy'
                              : state === 'picked-wrong'
                                ? 'border-terracotta/60 bg-terracotta/10'
                                : 'border-ink/10 bg-cream opacity-50')
                        }
                      >
                        {picked !== null &&
                          (opt.is_best ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                          ) : i === picked ? (
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                          ) : (
                            <span className="w-4 shrink-0" />
                          ))}
                        <span>
                          <span className="font-medium">{opt.text}</span>
                          <span className="ml-2 text-xs text-ink-soft">({opt.register})</span>
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* 选择后揭示：三语映射 + 考点 + 音频 */}
              <AnimatePresence>
                {picked !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-ink/10 bg-parchment p-4 shadow-(--shadow-soft)">
                      <div className="mb-3 flex gap-1.5">
                        {langTabs.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setLang(t.key)}
                            className={
                              'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
                              (lang === t.key
                                ? 'bg-navy text-parchment'
                                : 'bg-sand text-ink-soft hover:text-navy')
                            }
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={lang}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm leading-relaxed text-ink"
                        >
                          {item.trilingual_mapping[lang]}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gold">
                        <BookOpenText className="h-3.5 w-3.5" />
                        TCF B2 考点
                      </div>
                      <p className="text-sm leading-relaxed text-ink">{item.tcf_b2_takeaway}</p>
                    </div>

                    <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-(--shadow-soft)">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy">
                        <AudioLines className="h-3.5 w-3.5" />
                        听一遍 · Écoutez
                      </div>
                      <audio controls src={item.audio.url} className="mb-2 w-full" />
                      <p className="text-sm italic leading-relaxed text-ink-soft">
                        « {item.audio.transcript} »
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
