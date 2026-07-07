import { EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow'
import { motion } from 'framer-motion'

export interface BreathingEdgeData {
  /** 语法进阶关系说明，如 “礼貌条件式 → 正式申诉” */
  label?: string
  /** 端点尚未解锁时弱化显示 */
  dim?: boolean
}

/**
 * 呼吸感连线：底层实线 + 流动虚线（呼吸明暗）+ 沿路径巡游的光点，
 * 表示两个交际目的之间的语法进阶关系。
 */
export default function BreathingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<BreathingEdgeData>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const dim = data?.dim ?? false
  const stroke = dim ? 'rgba(92, 98, 112, 0.30)' : '#b98a2e'

  return (
    <g>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.2} opacity={0.35} />
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="5 11"
        animate={{ strokeDashoffset: [0, -64], opacity: dim ? [0.25, 0.45, 0.25] : [0.35, 0.95, 0.35] }}
        transition={{
          strokeDashoffset: { duration: 3.2, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      {!dim && (
        <circle r={3} fill="#c1674d" opacity={0.85}>
          <animateMotion dur="4.5s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className={
              'pointer-events-none absolute rounded-full border border-ink/10 bg-parchment/90 px-2 py-0.5 text-[10px] ' +
              (dim ? 'text-ink-soft/70' : 'text-ink-soft')
            }
            data-edge-label={id}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}
