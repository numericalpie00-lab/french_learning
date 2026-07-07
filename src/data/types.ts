/** 全局三档语言模式：纯法语沉浸 / 英文词源锚点 / 中文大白话逻辑 */
export type Lang = 'fr' | 'en' | 'zh'

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

/** 从三语映射中按全局语言模式取内容 */
export function pickMapping(mapping: TrilingualMapping, lang: Lang): string {
  return lang === 'fr' ? mapping.fr : lang === 'en' ? mapping.en_anchor : mapping.zh_logic
}

/**
 * 按句切分的字幕段。
 * start/end（秒）用于录音音频的时间戳卡拉OK高亮；
 * TTS 朗读模式下逐句排队，高亮由 SpeechSynthesis 的 onstart 事件驱动。
 */
export interface TranscriptSegment {
  start: number
  end: number
  fr: string
  en: string
  zh: string
}

export interface AudioClip {
  url: string
  /** 逐句字幕，随全局三档语言开关切换显示文本 */
  transcript: TranscriptSegment[]
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
