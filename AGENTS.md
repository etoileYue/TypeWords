# TypeWords 协作说明

## 项目概览

TypeWords 是一个基于 pnpm workspace 的 TypeScript/Vue monorepo，主要用于英语单词和文章跟打练习。

主要模块：

- `apps/nuxt`：官网和主 Web 应用，使用 Nuxt 4，默认开发端口为 `5567`。
- `packages/core`：业务逻辑、状态、hooks、API、通用页面组件。
- `packages/base`：基础 UI 组件库。
- `packages/libs`：翻译、语言列表等通用库。

## 日语练习相关代码位置

本轮任务重点关注日语练习相关功能时，优先查看和修改以下位置，避免误改英语单词或文章练习的通用逻辑：

- `packages/core/src/components/word/TypeWord.vue`：日语单词练习主入口。这里判断 `word.language === 'ja'` / `store.sdict.language === 'ja'`，处理汉字输入与罗马音输入切换、隐藏 IME 输入框、composition/input/keydown 事件、练习目标展示、日语例句发音按钮和 `.ja-input-mode` / `.ja-ime-input` 样式。
- `packages/core/src/utils/japanese.ts`：日语练习目标计算。`getJapanesePracticeTarget` 在罗马音模式下优先使用 `word.reading`，并通过 `wanakana` 的 `toRomaji` 转换输入目标。
- `packages/core/src/stores/setting.ts`：日语输入模式设置。`japanesePracticeInputMode: 'kanji' | 'romaji'` 默认值为 `kanji`，由 `TypeWord.vue` 的切换按钮直接更新。
- `packages/core/src/hooks/event.ts`：全局键盘事件。日语练习中遇到 IME composition 或 `keyCode === 229` 时跳过全局快捷键处理，避免输入法候选确认被误判。
- `packages/core/src/hooks/sound.ts`：发音逻辑。日语 TTS 使用 `ja-JP`，并优先选择日语浏览器声色。
- `packages/core/src/types/types.ts`：语言类型和词条结构。`LanguageType` / `TranslateLanguageType` 包含 `ja`，`Word.reading` 可作为日语假名读音来源。
- `apps/nuxt/public/list/custom_word.json`：日语词库入口，目前包含 `shin-nihongo-shokyu`，语言为 `ja`，翻译语言为 `zh-CN`。
- `apps/nuxt/public/dicts/ja/word/shin-nihongo-shokyu.json`：日语词库数据，体积较大；只在需要调整词条、读音、音频或例句数据时修改。
- `packages/core/package.json`：`wanakana` 依赖声明，支撑罗马音转换。

## 常用命令

优先使用 pnpm：

```bash
pnpm install
pnpm run dev
pnpm run build
```

说明：

- `pnpm run dev` 会启动 `@typewords/nuxt`。
- 根 `test` 脚本为空；多数 workspace 包内也没有实际测试脚本。

## 构建与部署注意事项

- 根 `build` / `generate` 会转到 Nuxt 静态生成。
- `apps/nuxt` 的 `generate`、`generate-dev` 包含部署脚本 `scripts/deploy-eo-pages.js`。
- 如果只需要 Nuxt 本地开发验证，优先跑 `pnpm run dev`。

## 代码风格与实现约定

- 主要语言是 TypeScript 和 Vue SFC。
- 优先沿用现有组件和工具：`@typewords/base`、`@typewords/core`、Pinia、UnoCSS、Vue Macros、unplugin-icons。
- Nuxt 应用别名 `@` 指向 `apps/nuxt/app`。
- 共享业务代码优先放在 `packages/core`，基础 UI 优先放在 `packages/base`，不要在 app 内重复实现已有公共能力。
- 修改用户可见文案时，注意 `apps/nuxt/i18n/locales` 下的多语言 JSON。

## 工作区注意事项

- 仓库当前可能存在未提交的用户改动，改文件前先看 `git status --short`。
- 不要回滚非本次任务产生的改动。
- `pnpm-workspace.yaml` 可能包含本地 install/build 审批配置，除非任务明确要求，不要随意改动。
