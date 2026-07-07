import { useMemo } from 'react'
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow'
import { Map } from 'lucide-react'
import type { TcfB2Item } from '../data/types'

interface GraphPanelProps {
  items: TcfB2Item[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const nodeBase: React.CSSProperties = {
  borderRadius: 14,
  padding: '10px 18px',
  fontSize: 13,
  border: '1px solid rgba(45, 49, 66, 0.12)',
  boxShadow: '0 2px 10px rgba(45, 49, 66, 0.08)',
  fontFamily: 'inherit',
}

/** 图谱区：以「交际功能 → 场景卡片」的方式铺开题库 */
export default function GraphPanel({ items, selectedId, onSelect }: GraphPanelProps) {
  const { nodes, edges } = useMemo(() => {
    const categories = [...new Set(items.map((i) => i.category))]

    const nodes: Node[] = [
      {
        id: 'root',
        position: { x: 40, y: 40 },
        data: { label: 'TCF Canada · B2' },
        style: {
          ...nodeBase,
          background: '#1e2a44',
          color: '#f9f6f0',
          fontWeight: 600,
          fontSize: 14,
        },
      },
    ]
    const edges: Edge[] = []

    categories.forEach((cat, ci) => {
      const catId = `cat-${cat}`
      nodes.push({
        id: catId,
        position: { x: 240, y: 40 + ci * 170 },
        data: { label: cat },
        style: {
          ...nodeBase,
          background: '#efe9dd',
          color: '#1e2a44',
          fontWeight: 600,
        },
      })
      edges.push({
        id: `e-root-${catId}`,
        source: 'root',
        target: catId,
        animated: false,
        style: { stroke: '#b98a2e', strokeWidth: 1.5 },
      })

      items
        .filter((i) => i.category === cat)
        .forEach((item, ii) => {
          const selected = item.id === selectedId
          nodes.push({
            id: item.id,
            position: { x: 460, y: 20 + ci * 170 + ii * 90 },
            data: { label: item.immersion_scenario.slice(0, 24) + '…' },
            style: {
              ...nodeBase,
              width: 220,
              background: selected ? '#c1674d' : '#fffdf8',
              color: selected ? '#fffdf8' : '#2d3142',
              borderColor: selected ? '#c1674d' : 'rgba(45, 49, 66, 0.12)',
              cursor: 'pointer',
            },
          })
          edges.push({
            id: `e-${catId}-${item.id}`,
            source: catId,
            target: item.id,
            animated: selected,
            style: { stroke: '#7a8450', strokeWidth: 1.5 },
          })
        })
    })

    return { nodes, edges }
  }, [items, selectedId])

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream/60 shadow-(--shadow-soft)">
      <header className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
        <Map className="h-4 w-4 text-terracotta" />
        <h2 className="text-sm font-semibold tracking-wide text-navy">
          图谱区 · Carte des actes de parole
        </h2>
      </header>
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => {
            if (node.id !== 'root' && !node.id.startsWith('cat-')) onSelect(node.id)
          }}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color="rgba(45,49,66,0.15)" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  )
}
