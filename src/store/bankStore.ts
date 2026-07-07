import { create } from 'zustand'
import bank from '../data/tcf_b2_bank.json'
import type { TcfB2Item } from '../data/types'

const STORAGE_KEY = 'tcf_b2_custom_bank'

/** 收集箱录入条目的 id 前缀，用于区分静态题库与用户数据 */
export const INGESTED_PREFIX = 'ingested-'

function loadCustom(): TcfB2Item[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCustom(items: TcfB2Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

interface BankState {
  /** 静态题库 + LocalStorage 中的收集箱条目 */
  items: TcfB2Item[]
  addItem: (item: TcfB2Item) => void
  /** 仅允许移除收集箱条目 */
  removeItem: (id: string) => void
}

export const useBankStore = create<BankState>((set) => ({
  items: [...(bank as TcfB2Item[]), ...loadCustom()],
  addItem: (item) =>
    set((s) => {
      saveCustom([...loadCustom(), item])
      return { items: [...s.items, item] }
    }),
  removeItem: (id) =>
    set((s) => {
      if (!id.startsWith(INGESTED_PREFIX)) return s
      saveCustom(loadCustom().filter((i) => i.id !== id))
      return { items: s.items.filter((i) => i.id !== id) }
    }),
}))
