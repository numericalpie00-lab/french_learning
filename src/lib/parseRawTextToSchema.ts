import type { ExpressionOption, TcfB2Item, TranscriptSegment } from '../data/types'

/**
 * 模拟解析：把考友回忆的中法混合零碎文本转换为标准题库结构。
 * 生产环境中这里会调用 LLM 做真正的抽取与三语生成；
 * 当前用启发式 mock：法语句子抽取 + 关键词判类 + 模板化三语映射 + 假音频链接。
 */

/** 交际目的关键词表（命中即归类，从上到下优先） */
const CATEGORY_RULES: [RegExp, string][] = [
  [/抱怨|投诉|不满|réclamation|se plaindre|mécontent/i, '抱怨'],
  [/请求|拜托|求助|pourriez|demander|serait-il possible/i, '请求'],
  [/过去|回忆|昨天|上周|经历|passé|imparfait|dernier/i, '描述过去'],
  [/观点|看法|认为|同意|argument|opinion|à mon avis/i, '表达观点'],
  [/假设|如果|委婉|遗憾|si j['e]|hypothèse|regret/i, '假设与委婉'],
]

/** 法语句子片段：拉丁字母连续段，需含常见法语功能词或重音符号 */
const FRENCH_RUN = /[A-Za-zÀ-ÖØ-öø-ÿŒœ][A-Za-zÀ-ÖØ-öø-ÿŒœ0-9'’,;:\- ]*[.!?…]?/g
const FRENCH_HINT =
  /[àâçéèêëîïôùûüœ]|\b(le|la|les|un|une|des|je|tu|il|elle|nous|vous|est|sont|de|du|au|aux|et|que|qui|ne|pas|pour|avec|dans|sur|mon|ma|mes|ce|cette)\b/i

function extractFrenchSentences(raw: string): string[] {
  const runs = raw.match(FRENCH_RUN) ?? []
  const seen = new Set<string>()
  const result: string[] = []
  for (const run of runs) {
    const s = run.trim().replace(/\s+/g, ' ')
    if (s.length < 12 || !/\s/.test(s) || !FRENCH_HINT.test(s)) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(/[.!?…]$/.test(s) ? s : s + '.')
  }
  return result
}

function extractChineseSummary(raw: string): string {
  const withoutFrench = raw.replace(FRENCH_RUN, ' ')
  const parts = withoutFrench
    .split(/[。！？；\n.!?;]+/)
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter((p) => /[一-鿿]/.test(p))
  return parts.join('。').slice(0, 160)
}

function guessRegister(sentence: string): string {
  if (/\b(tu|t'|ton|ta|tes)\b/i.test(sentence)) return 'familier'
  if (/pourriez|veuillez|je vous (prie|saurais)|je me permets|serait-il/i.test(sentence)) {
    return 'soutenu'
  }
  return 'courant'
}

export function parseRawTextToSchema(rawText: string): TcfB2Item | null {
  const raw = rawText.trim()
  if (!raw) return null

  const french = extractFrenchSentences(raw)
  if (french.length === 0) return null // 没有可用的法语表达，无法成题

  const category = CATEGORY_RULES.find(([re]) => re.test(raw))?.[1] ?? '综合表达'
  const id = `ingested-${Date.now().toString(36)}`

  const options: ExpressionOption[] = french.slice(0, 3).map((text) => ({
    text,
    register: guessRegister(text),
    is_best: false,
  }))
  // 优先把最正式的表达标为最优，否则取第一句
  const bestIdx = Math.max(
    options.findIndex((o) => o.register === 'soutenu'),
    0,
  )
  options[bestIdx].is_best = true
  const best = options[bestIdx].text

  const zhSummary = extractChineseSummary(raw)
  const scenario = zhSummary
    ? `考友回忆：${zhSummary}`
    : `考友回忆的「${category}」场景（原文为法语，待补充中文情境描述）。`

  // 逐句字幕：按每句约 2.8s 生成 mock 时间戳，译文占位待 LLM 生成
  const transcript: TranscriptSegment[] = french.slice(0, 6).map((fr, i) => ({
    start: +(i * 2.8).toFixed(1),
    end: +((i + 1) * 2.8).toFixed(1),
    fr,
    en: '(EN translation pending — generated after LLM ingestion)',
    zh: '（中文译文待生成，接入 LLM 后自动补全）',
  }))

  return {
    id,
    category,
    immersion_scenario: scenario,
    options,
    trilingual_mapping: {
      fr: `« ${best} » est ici l'expression la plus adaptée : registre ${options[bestIdx].register}, typique des situations d'examen de la catégorie « ${category} ».`,
      en_anchor: `(auto-anchor) Key phrase: « ${best} ». Etymology anchors and Latin-root cognates will be generated once the LLM pipeline is connected.`,
      zh_logic: `（自动解析）这条属于「${category}」类表达，先整句记住最优说法：“${best}”。详细的词源锚点与逻辑拆解将在接入 LLM 后自动生成，录入后也可人工润色。`,
    },
    tcf_b2_takeaway: `（机经收录）本素材与 TCF Canada「${category}」类题型相关${zhSummary ? `，考友原话：${zhSummary.slice(0, 60)}` : ''}。建议核对后补充真实考点说明。`,
    audio: {
      url: `/audio/${id}.wav`, // 假音频链接：文件尚不存在，播放器会优雅降级并可切 TTS 朗读
      transcript,
    },
  }
}
