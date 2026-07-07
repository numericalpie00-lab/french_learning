/** 表达选项：供用户在沙盘中做直觉选择 */
export interface ExpressionOption {
  text: string
  /** 语域标签：familier / courant / soutenu / formel ... */
  register: string
  /** 是否为该场景下的最优表达 */
  is_best: boolean
}

/** 三语映射：沉浸法语 + 英文词源锚点 + 中文逻辑拆解 */
export interface TrilingualMapping {
  /** 纯净沉浸法语解释 */
  fr: string
  /** 英文词源锚点：同源词与逻辑 */
  en_anchor: string
  /** 中文大白话逻辑拆解，直击交际目的 */
  zh_logic: string
}

export interface AudioClip {
  url: string
  transcript: string
}

/** TCF B2 题库条目 */
export interface TcfB2Item {
  id: string
  /** 交际功能分类：请求、抱怨、描述过去 ... */
  category: string
  /** 引发共鸣的日常或考试场景 */
  immersion_scenario: string
  options: ExpressionOption[]
  trilingual_mapping: TrilingualMapping
  /** 高度相关的 TCF 考点或真题示例 */
  tcf_b2_takeaway: string
  audio: AudioClip
}
