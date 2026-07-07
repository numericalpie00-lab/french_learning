import { create } from 'zustand'
import type { Lang } from '../data/types'

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
}

/** 全局三档语言开关：纯法语沉浸 / 英文词源锚点 / 中文大白话逻辑 */
export const useLangStore = create<LangState>((set) => ({
  lang: 'fr',
  setLang: (lang) => set({ lang }),
}))
