import { useState } from 'react'
import { Feather, Inbox } from 'lucide-react'
import GraphPanel from './components/GraphPanel'
import IngestionBox from './components/IngestionBox'
import LangToggle from './components/LangToggle'
import SandboxPanel from './components/SandboxPanel'
import { useBankStore } from './store/bankStore'

export default function App() {
  const items = useBankStore((s) => s.items)
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)
  const [boxOpen, setBoxOpen] = useState(false)
  const selected = items.find((i) => i.id === selectedId) ?? null

  return (
    <div className="relative z-10 flex h-full flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-3 px-1">
        <Feather className="h-5 w-5 text-terracotta" />
        <h1 className="text-xl font-bold tracking-tight text-navy">Carnet de Français</h1>
        <p className="hidden text-sm text-ink-soft sm:block">沉浸式法语 · TCF Canada B2 备考</p>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setBoxOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream px-3 py-2 text-xs font-semibold text-navy shadow-(--shadow-soft) transition-colors hover:border-terracotta/50"
          >
            <Inbox className="h-3.5 w-3.5 text-terracotta" />
            <span className="hidden sm:inline">真题收集箱</span>
          </button>
          <LangToggle />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* 左侧 / 主体：语境直觉图谱 */}
        <div className="min-h-[320px] flex-1">
          <GraphPanel items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        {/* 右侧：微型情境沙盘 */}
        <div className="min-h-0 lg:w-105 lg:shrink-0">
          <SandboxPanel item={selected} />
        </div>
      </main>

      <IngestionBox open={boxOpen} onClose={() => setBoxOpen(false)} onIngested={setSelectedId} />
    </div>
  )
}
