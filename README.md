# Carnet de Français · 沉浸式法语学习 & TCF Canada B2 备考

一个 Warm Analog（羊皮纸手账）风格的法语学习 Web App：
以「交际功能图谱 + 沙盘演练」的方式，通过场景共鸣 → 直觉选择 → 三语解构 → TCF 考点提炼的闭环练习备考 TCF Canada B2。

## 技术栈

- **Vite + React + TypeScript**
- **Tailwind CSS v4**（`@tailwindcss/vite` 插件，设计令牌见 `src/index.css` 的 `@theme`）
- **reactflow** — 左侧知识图谱
- **framer-motion** — 沙盘揭示动效与语言切换过渡
- **lucide-react** — 图标
- **zustand** — 全局三档语言状态（`src/store/langStore.ts`）

## 启动

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 生产构建
```

## 页面布局

- **顶部**：`src/components/LangToggle.tsx`，全局三档语言开关（纯法语沉浸 / 英文词源锚点 / 中文大白话逻辑），状态存于 zustand，沙盘解构卡片与音频字幕全部联动。
- **语境直觉图谱**（左侧/主体）：`src/components/GraphPanel.tsx`，气泡按「交际目的」命名（请求、抱怨……），不按教材章节。自定义 `BubbleNode`（圆形气泡、缓慢漂浮、入场弹簧动画）+ 自定义 `BreathingEdge`（流动虚线呼吸明暗 + 巡游光点 + 进阶关系标签），连线代表语法进阶路线；题库暂未覆盖的目的显示为虚线锁定气泡。点击气泡进入沙盘。
- **微型情境沙盘**（右侧）：`src/components/SandboxPanel.tsx`，分阶段渲染：A 情境代入 → 点击「代入好了，看表达」→ B 直觉选择（交错入场）→ C 三语解构（随全局开关）+ 音频 → D `tcf_b2_takeaway` 考点收尾于最下方。
- **动态真题收集箱**（顶栏按钮 → 右侧抽屉）：`src/components/IngestionBox.tsx`，粘贴中法混合的考友机经，「解析并录入」后追加进题库并实时更新图谱气泡。

## 真题收集箱（Dynamic Ingestion Box）

- `src/lib/parseRawTextToSchema.ts`：模拟解析器（生产环境将替换为 LLM 调用）。启发式抽取法语句子（重音符号 + 功能词识别）、按关键词判定交际目的、推断语域（tu → familier / pourriez → soutenu）并标记最优表达，自动生成模板化三语映射、机经考点说明、假音频链接与逐句 mock 时间戳字幕；识别不到法语句子时返回 null，UI 给出校验提示。
- `src/store/bankStore.ts`：题库 = 静态 `tcf_b2_bank.json` + LocalStorage（`tcf_b2_custom_bank`）中的收集箱条目，`addItem` 追加并持久化，`removeItem` 仅允许删除收集箱条目（`ingested-` 前缀）。
- 图谱联动：气泡本就由题库数据驱动——录入新分类会解锁对应的虚线气泡（或在底部自动新增气泡），删除后重新锁定；录入成功后沙盘自动切换到新题。

## 音频系统

双模式播放器（`src/components/AudioPlayer.tsx`），右上角「音频 / 朗读」切换：

- **音频模式**：`src/hooks/useAudio.ts` 播放录音文件，卡拉OK高亮由 `currentTime` 与句级时间戳匹配驱动，进度条可点击跳转。
- **朗读模式（零成本 TTS）**：`src/hooks/useTts.ts` 用浏览器原生 SpeechSynthesis（fr-FR 音色优先，rate 0.92）逐句排队朗读法语原文，高亮由每句 utterance 的 `onstart` 事件驱动；无语音引擎的环境会在 2.5s 看门狗超时后优雅降级并提示切回音频模式。
- **卡拉OK字幕**：`src/components/KaraokeTranscript.tsx` 逐句渲染，当前句高亮（左侧陶土色竖线 + 加深底色）并自动滚动到可视区；点击某句可跳转（音频模式 seek 到时间戳 / 朗读模式从该句重新开始）；句子文本跟随全局三档语言开关切换。
- `public/audio/*.wav` 目前是程序生成的占位钟琴音，替换为真实录音即可（保持文件名或改 JSON 中的 `audio.url`）。

## 数据结构

题库位于 `src/data/tcf_b2_bank.json`（类型定义见 `src/data/types.ts`）：

```jsonc
{
  "id": "tcf-b2-001",
  "category": "请求",                      // 交际功能：请求、抱怨、描述过去…
  "immersion_scenario": "…",              // 引发共鸣的日常/考试场景
  "options": [                             // 2-3 个供直觉选择的表达
    { "text": "…", "register": "soutenu", "is_best": true }
  ],
  "trilingual_mapping": {
    "fr": "…",                             // 纯净沉浸法语
    "en_anchor": "…",                      // 英文词源锚点（同源词与逻辑）
    "zh_logic": "…"                        // 中文大白话逻辑拆解
  },
  "tcf_b2_takeaway": "…",                 // 高度相关的 TCF 考点/真题示例
  "audio": {
    "url": "/audio/….wav",
    "transcript": [                        // 按句切分 + 时间戳，三语文本随全局开关切换
      { "start": 0, "end": 2.4, "fr": "…", "en": "…", "zh": "…" }
    ]
  }
}
```

音频文件放在 `public/audio/`。

## 教学资源批量下载（download_media.py）

项目根目录的 `download_media.py` 用于批量下载 freemdict 开放目录中的「你好法语 0-B1」教学资源（A1/A2 的音频/视频/文本）到 `public/media/`（已加入 `.gitignore`，不入库）：

```bash
pip install requests beautifulsoup4 tqdm
python3 download_media.py --dry-run    # 先看会下载哪些文件
python3 download_media.py              # 正式下载（默认只要 A1/A2）
python3 download_media.py --all        # 不过滤，全部下载
```

递归爬取子目录、保留目录结构、已存在且大小一致的文件自动跳过（可断点续跑）、失败自动重试 3 次；进度条优先用 tqdm，未安装时退回内置简易进度条。注意：请在本机运行——Claude 云端容器的网络策略不允许访问该站点。

## Warm Analog 设计令牌

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `parchment` | `#F9F6F0` | 全局羊皮纸背景 |
| `cream` / `sand` | `#FFFDF8` / `#EFE9DD` | 卡片 / 次级底色 |
| `ink` / `navy` | `#2D3142` / `#1E2A44` | 正文 / 标题 |
| `terracotta` / `olive` / `gold` | `#C1674D` / `#7A8450` / `#B98A2E` | 点缀强调 |

组件统一使用柔和圆角（`rounded-xl/2xl`）与低饱和阴影（`--shadow-soft` / `--shadow-card`）。
