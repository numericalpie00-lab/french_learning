import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Anchor,
  ArrowRight,
  BookOpenText,
  Check,
  Feather,
  Lightbulb,
  MessageCircleQuestion,
  MessagesSquare,
  Target,
  X,
} from 'lucide-react'
import { pickMapping, type Lang, type TcfB2Item } from '../data/types'
import { useLangStore } from '../store/langStore'
import AudioPlayer from './AudioPlayer'

interface SandboxPanelProps {
  item: TcfB2Item | null
}

/** 沙盘渲染阶段：情境代入 → 直觉选择 → 解构揭示 */
type Stage = 'scene' | 'choose' | 'reveal'

const mappingBadge: Record<Lang, { label: string; icon: typeof Feather }> = {
  fr: { label: '纯法语沉浸', icon: Feather },
  en: { label: '英文词源锚点', icon: Anchor },
  zh: { label: '中文大白话逻辑', icon: MessagesSquare },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
}
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

/** 微型情境沙盘：A 情境 → B 直觉选择 → C 三语解构（随全局开关）→ D 考点收尾 */
export default function SandboxPanel({ item }: SandboxPanelProps) {
  const [stage, setStage] = useState<Stage>('scene')
  const [picked, setPicked] = useState<number | null>(null)
  const lang = useLangStore((s) => s.lang)

  useEffect(() => {
    setStage('scene')
    setPicked(null)
  }, [item?.id])

  const badge = mappingBadge[lang]

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-(--shadow-card)">
      <header className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
        <Target className="h-4 w-4 text-olive" />
        <h2 className="text-sm font-semibold tracking-wide text-navy">
          微型情境沙盘 · Bac à sable
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
            在左侧图谱中点击一个交际目的气泡，
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
              {/* A. 情境代入 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl bg-sand/60 p-4"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-terracotta">
                  <MessageCircleQuestion className="h-3.5 w-3.5" />
                  场景
                </div>
                <p className="text-sm leading-relaxed text-ink">{item.immersion_scenario}</p>
              </motion.div>

              {stage === 'scene' && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStage('choose')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-parchment shadow-(--shadow-soft) hover:bg-navy/90"
                >
                  代入好了，看表达
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              )}

              {/* B. 直觉选择 */}
              {stage !== 'scene' && (
                <motion.div variants={stagger} initial="hidden" animate="show">
                  <motion.div
                    variants={rise}
                    className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    你的直觉是哪一句？
                  </motion.div>
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
                          variants={rise}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setPicked(i)
                            setStage('reveal')
                          }}
                          className={
                            'flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left text-sm leading-relaxed shadow-(--shadow-soft) transition-colors duration-300 ' +
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
                </motion.div>
              )}

              {/* C. 三语解构（随全局开关）+ 音频 + D. 考点收尾 */}
              {stage === 'reveal' && picked !== null && (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                  <motion.div
                    variants={rise}
                    className="rounded-2xl border border-ink/10 bg-parchment p-4 shadow-(--shadow-soft)"
                  >
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy">
                      <badge.icon className="h-3.5 w-3.5" />
                      {badge.label}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={lang}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="text-sm leading-relaxed text-ink"
                      >
                        {pickMapping(item.trilingual_mapping, lang)}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={rise}>
                    <AudioPlayer audio={item.audio} />
                  </motion.div>

                  <motion.div
                    variants={rise}
                    className="rounded-2xl border border-gold/30 bg-gold/10 p-4"
                  >
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gold">
                      <BookOpenText className="h-3.5 w-3.5" />
                      TCF B2 考点
                    </div>
                    <p className="text-sm leading-relaxed text-ink">{item.tcf_b2_takeaway}</p>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
