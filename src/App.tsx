import { useState } from 'react'
import { Feather } from 'lucide-react'
import GraphPanel from './components/GraphPanel'
import SandboxPanel from './components/SandboxPanel'
import bank from './data/tcf_b2_bank.json'
import type { TcfB2Item } from './data/types'

const items = bank as TcfB2Item[]

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)
  const selected = items.find((i) => i.id === selectedId) ?? null

  return (
    <div className="relative z-10 flex h-full flex-col gap-4 p-4 md:p-6">
      <header className="flex items-baseline gap-3 px-1">
        <Feather className="h-5 w-5 self-center text-terracotta" />
        <h1 className="text-xl font-bold tracking-tight text-navy">Carnet de Français</h1>
        <p className="text-sm text-ink-soft">沉浸式法语 · TCF Canada B2 备考</p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* 左侧 / 主体：图谱区 */}
        <div className="min-h-[320px] flex-1">
          <GraphPanel items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        {/* 右侧：沙盘演练区 */}
        <div className="min-h-0 lg:w-105 lg:shrink-0">
          <SandboxPanel item={selected} />
        </div>
      </main>
    </div>
  )
}
