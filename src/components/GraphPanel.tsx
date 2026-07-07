import { useMemo } from 'react'
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow'
import { Map } from 'lucide-react'
import BubbleNode, { type BubbleData } from './graph/BubbleNode'
import BreathingEdge, { type BreathingEdgeData } from './graph/BreathingEdge'
import type { TcfB2Item } from '../data/types'

interface GraphPanelProps {
  items: TcfB2Item[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const nodeTypes = { bubble: BubbleNode }
const edgeTypes = { breathing: BreathingEdge }

/** 气泡星座：按交际目的手工布点；题库暂未覆盖的目的作为进阶路线占位 */
const constellation: { key: string; fr: string; x: number; y: number }[] = [
  { key: '请求', fr: 'Demander poliment', x: 60, y: 100 },
  { key: '抱怨', fr: 'Se plaindre', x: 360, y: 210 },
  { key: '描述过去', fr: 'Raconter au passé', x: 470, y: 10 },
  { key: '假设与委婉', fr: 'Hypothèse & nuance', x: 130, y: 380 },
  { key: '表达观点', fr: 'Argumenter', x: 560, y: 420 },
]

/** 语法进阶关系（连线 + 说明标签） */
const progressions: { from: string; to: string; label: string }[] = [
  { from: '请求', to: '抱怨', label: '礼貌条件式 → 正式申诉' },
  { from: '请求', to: '假设与委婉', label: 'si + imparfait 委婉' },
  { from: '抱怨', to: '表达观点', label: '申诉 → 论证展开' },
  { from: '描述过去', to: '假设与委婉', label: '过去叙事 → 遗憾假设' },
]

/** 语境直觉图谱：交际目的气泡 + 呼吸感进阶连线 */
export default function GraphPanel({ items, selectedId, onSelect }: GraphPanelProps) {
  const selectedCategory = items.find((i) => i.id === selectedId)?.category ?? null

  const { nodes, edges } = useMemo(() => {
    const available = new Set(items.map((i) => i.category))

    // 星座之外的新题库分类自动补位到底部一行
    const defs = [...constellation]
    let extra = 0
    for (const cat of available) {
      if (!defs.some((d) => d.key === cat)) {
        defs.push({ key: cat, fr: '', x: 60 + extra++ * 220, y: 560 })
      }
    }

    const nodes: Node<BubbleData>[] = defs.map((d, i) => ({
      id: d.key,
      type: 'bubble',
      position: { x: d.x, y: d.y },
      data: {
        label: d.key,
        fr: d.fr,
        locked: !available.has(d.key),
        active: d.key === selectedCategory,
        count: items.filter((it) => it.category === d.key).length,
        index: i,
      },
    }))

    const edges: Edge<BreathingEdgeData>[] = progressions.map((p) => ({
      id: `${p.from}->${p.to}`,
      source: p.from,
      target: p.to,
      type: 'breathing',
      data: { label: p.label, dim: !available.has(p.from) || !available.has(p.to) },
    }))

    return { nodes, edges }
  }, [items, selectedCategory])

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream/60 shadow-(--shadow-soft)">
      <header className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
        <Map className="h-4 w-4 text-terracotta" />
        <h2 className="text-sm font-semibold tracking-wide text-navy">
          语境直觉图谱 · Carte des intentions
        </h2>
      </header>
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => {
            const first = items.find((i) => i.category === node.id)
            if (first) onSelect(first.id)
          }}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color="rgba(45,49,66,0.15)" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="pointer-events-none absolute right-4 bottom-3 text-[11px] text-ink-soft">
        点击气泡进入沙盘演练 · 虚线气泡为进阶路线，敬请期待
      </p>
    </section>
  )
}
