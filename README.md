# Carnet de Français · 沉浸式法语学习 & TCF Canada B2 备考

一个 Warm Analog（羊皮纸手账）风格的法语学习 Web App：
以「交际功能图谱 + 沙盘演练」的方式，通过场景共鸣 → 直觉选择 → 三语解构 → TCF 考点提炼的闭环练习备考 TCF Canada B2。

## 技术栈

- **Vite + React + TypeScript**
- **Tailwind CSS v4**（`@tailwindcss/vite` 插件，设计令牌见 `src/index.css` 的 `@theme`）
- **reactflow** — 左侧知识图谱
- **framer-motion** — 沙盘揭示动效
- **lucide-react** — 图标

## 启动

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 生产构建
```

## 页面布局

- **图谱区**（左侧/主体）：`src/components/GraphPanel.tsx`，按「TCF B2 → 交际功能分类 → 场景卡片」展开，点击卡片加载到沙盘。
- **沙盘演练区**（右侧）：`src/components/SandboxPanel.tsx`，展示沉浸场景，用户做直觉选择后揭示三语映射、TCF 考点与音频。

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
  "audio": { "url": "/audio/….mp3", "transcript": "…" }
}
```

音频文件放在 `public/audio/`（当前为占位路径，`transcript` 已就位）。

## Warm Analog 设计令牌

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `parchment` | `#F9F6F0` | 全局羊皮纸背景 |
| `cream` / `sand` | `#FFFDF8` / `#EFE9DD` | 卡片 / 次级底色 |
| `ink` / `navy` | `#2D3142` / `#1E2A44` | 正文 / 标题 |
| `terracotta` / `olive` / `gold` | `#C1674D` / `#7A8450` / `#B98A2E` | 点缀强调 |

组件统一使用柔和圆角（`rounded-xl/2xl`）与低饱和阴影（`--shadow-soft` / `--shadow-card`）。
