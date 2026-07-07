import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'

export interface BubbleData {
  /** 交际目的名称：请求、抱怨、描述过去 ... */
  label: string
  /** 法语名（沉浸感副标） */
  fr: string
  /** 题库中暂无内容，作为进阶路线占位 */
  locked: boolean
  active: boolean
  /** 该交际目的下的场景数 */
  count: number
  /** 用于错开漂浮动画相位 */
  index: number
}

/** 语境直觉气泡：圆形节点 + 缓慢漂浮，按交际目的命名 */
function BubbleNode({ data }: NodeProps<BubbleData>) {
  const { label, fr, locked, active, count, index } = data
  const hidden = { opacity: 0 } as const

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} isConnectable={false} style={hidden} />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: index * 0.08 }}
      >
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{
            duration: 3.6 + (index % 3) * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.5,
          }}
          whileHover={locked ? undefined : { scale: 1.07 }}
          whileTap={locked ? undefined : { scale: 0.95 }}
          className={
            'flex flex-col items-center justify-center rounded-full text-center transition-shadow duration-300 ' +
            (locked
              ? 'h-24 w-24 border-2 border-dashed border-ink/20 bg-sand/50 text-ink-soft'
              : active
                ? 'h-32 w-32 cursor-pointer border border-terracotta bg-terracotta text-parchment shadow-(--shadow-card) ring-4 ring-terracotta/20'
                : 'h-32 w-32 cursor-pointer border border-ink/10 bg-cream text-navy shadow-(--shadow-soft) hover:shadow-(--shadow-card)')
          }
        >
          {locked ? (
            <Lock className="mb-1 h-3.5 w-3.5" />
          ) : (
            <Sparkles className={'mb-1 h-4 w-4 ' + (active ? 'text-parchment' : 'text-gold')} />
          )}
          <span className={'font-bold ' + (locked ? 'text-xs' : 'text-base')}>{label}</span>
          {fr && (
            <span
              className={
                'mt-0.5 px-2 text-[10px] leading-tight ' +
                (active ? 'text-parchment/80' : locked ? '' : 'text-ink-soft')
              }
            >
              {fr}
            </span>
          )}
          {locked ? (
            <span className="mt-0.5 text-[10px]">敬请期待</span>
          ) : (
            <span
              className={
                'mt-1 rounded-full px-2 text-[10px] ' +
                (active ? 'bg-parchment/20' : 'bg-sand text-ink-soft')
              }
            >
              {count} 场景
            </span>
          )}
        </motion.div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={hidden} />
    </div>
  )
}

export default memo(BubbleNode)
