import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Inbox, Sparkles, Trash2, TriangleAlert, X } from 'lucide-react'
import { parseRawTextToSchema } from '../lib/parseRawTextToSchema'
import { INGESTED_PREFIX, useBankStore } from '../store/bankStore'
import type { TcfB2Item } from '../data/types'

interface IngestionBoxProps {
  open: boolean
  onClose: () => void
  /** 录入成功后回调（用于在图谱/沙盘中选中新条目） */
  onIngested: (id: string) => void
}

type Feedback = { type: 'ok'; item: TcfB2Item } | { type: 'error'; msg: string } | null

const PLACEHOLDER = `粘贴考友回忆的零碎文本（中法混合即可），例如：

今天口语考到了描述过去的经历，考官问周末做了什么。
我说 Le week-end dernier, je suis allé au marché avec ma famille.
然后补充 C'était vraiment agréable de flâner au soleil.
大家记住用 imparfait 描述背景。`

/** 动态真题收集箱：粘贴机经 → 模拟解析为标准题库结构 → 追加进本地题库（LocalStorage 持久化） */
export default function IngestionBox({ open, onClose, onIngested }: IngestionBoxProps) {
  const [rawText, setRawText] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const items = useBankStore((s) => s.items)
  const addItem = useBankStore((s) => s.addItem)
  const removeItem = useBankStore((s) => s.removeItem)

  const customItems = items.filter((i) => i.id.startsWith(INGESTED_PREFIX))

  const handleParse = () => {
    const item = parseRawTextToSchema(rawText)
    if (!item) {
      setFeedback({
        type: 'error',
        msg: rawText.trim()
          ? '没有识别到可用的法语句子——请确认粘贴内容里包含完整的法语表达。'
          : '收集箱是空的，先粘贴一段考友回忆吧。',
      })
      return
    }
    addItem(item)
    setFeedback({ type: 'ok', item })
    setRawText('')
    onIngested(item.id)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink/10 bg-parchment shadow-(--shadow-card)"
          >
            <header className="flex items-center gap-2 border-b border-ink/10 px-5 py-4">
              <Inbox className="h-4 w-4 text-terracotta" />
              <h2 className="text-sm font-semibold tracking-wide text-navy">
                动态真题收集箱 · Boîte de collecte
              </h2>
              <button
                onClick={onClose}
                aria-label="关闭收集箱"
                className="ml-auto rounded-full p-1.5 text-ink-soft transition-colors hover:bg-sand hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <p className="text-xs leading-relaxed text-ink-soft">
                把网上看到的 TCF 机经、考友回忆直接丢进来。解析器会抽取法语表达、判断交际目的，
                生成标准题库条目并同步到浏览器 LocalStorage——图谱气泡随之实时更新。
                （当前为模拟解析，接入 LLM 后将生成真实的三语拆解。）
              </p>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={PLACEHOLDER}
                aria-label="机经原文"
                className="min-h-48 w-full resize-y rounded-xl border border-ink/10 bg-cream p-3 text-sm leading-relaxed text-ink shadow-(--shadow-soft) placeholder:text-ink-soft/60 focus:border-terracotta/60 focus:ring-2 focus:ring-terracotta/20 focus:outline-none"
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleParse}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-parchment shadow-(--shadow-soft) transition-colors hover:bg-navy/90"
              >
                <Sparkles className="h-4 w-4" />
                解析并录入 · Parse &amp; Ingest
              </motion.button>

              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.div
                    key={feedback.type === 'ok' ? feedback.item.id : 'error'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={
                      'rounded-xl border p-3 text-xs leading-relaxed ' +
                      (feedback.type === 'ok'
                        ? 'border-olive/40 bg-olive/10 text-navy'
                        : 'border-terracotta/40 bg-terracotta/10 text-navy')
                    }
                  >
                    {feedback.type === 'ok' ? (
                      <div className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                        <div>
                          <p className="font-semibold">
                            已录入「{feedback.item.category}」 ·{' '}
                            {feedback.item.options.length} 个表达
                          </p>
                          <p className="mt-1 text-ink-soft">
                            图谱气泡已更新，沙盘已切换到这条新题；可关闭收集箱直接演练。
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                        <p>{feedback.msg}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <h3 className="mb-2 text-xs font-semibold text-navy">
                  已收录机经（{customItems.length}）
                </h3>
                {customItems.length === 0 ? (
                  <p className="text-xs text-ink-soft">还没有收录，粘贴第一条试试。</p>
                ) : (
                  <ul className="space-y-2">
                    {customItems.map((it) => (
                      <motion.li
                        key={it.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2 rounded-xl border border-ink/10 bg-cream p-3 shadow-(--shadow-soft)"
                      >
                        <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-navy">
                          {it.category}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-xs text-ink">
                          {it.options[0]?.text}
                        </p>
                        <button
                          onClick={() => removeItem(it.id)}
                          aria-label="删除该条机经"
                          className="shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-terracotta/10 hover:text-terracotta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <footer className="border-t border-ink/10 px-5 py-3 text-[11px] text-ink-soft">
              数据保存在本浏览器 LocalStorage，清除站点数据会一并清空收集箱。
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
