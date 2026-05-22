# TypeWords 协作说明

## 项目概览

TypeWords 是一个基于 pnpm workspace 的 TypeScript/Vue monorepo，主要用于英语单词和文章跟打练习。

主要模块：

- `apps/nuxt`：官网和主 Web 应用，使用 Nuxt 4，默认开发端口为 `5567`。
- `apps/vscode-web`：VS Code WebView/嵌入式 Web 应用，使用 Vite，默认开发端口为 `3000`。
- `apps/vscode`：VS Code 扩展本体。
- `packages/core`：业务逻辑、状态、hooks、API、通用页面组件。
- `packages/base`：基础 UI 组件库。
- `packages/libs`：翻译、语言列表等通用库。

## 常用命令

优先使用 pnpm：

```bash
pnpm install
pnpm run dev
pnpm run dev-vscode-web
pnpm run build
pnpm run build-vscode-web
```

说明：

- `pnpm run dev` 会启动 `@typewords/nuxt`。
- `pnpm run dev-vscode-web` 会启动 `@typewords/vscode-web`。
- 根 `test` 脚本为空；多数 workspace 包内也没有实际测试脚本。
- `apps/vscode` 可用 `pnpm -F typewords compile` 编译扩展。

## 构建与部署注意事项

- 根 `build` / `generate` 会转到 Nuxt 静态生成。
- `apps/nuxt` 的 `generate`、`generate-dev` 和 `apps/vscode-web` 的 `build` 包含部署脚本 `scripts/deploy-eo-pages.js`。
- 如果只需要本地验证 Vite Web 应用构建，优先使用 `pnpm -F @typewords/vscode-web build2`，避免触发部署。
- 如果只需要 Nuxt 本地开发验证，优先跑 `pnpm run dev`。

## 代码风格与实现约定

- 主要语言是 TypeScript 和 Vue SFC。
- 优先沿用现有组件和工具：`@typewords/base`、`@typewords/core`、Pinia、UnoCSS、Vue Macros、unplugin-icons。
- Nuxt 应用别名 `@` 指向 `apps/nuxt/app`。
- Vite Web 应用别名 `@` 和 `~` 指向 `apps/vscode-web/src`。
- 共享业务代码优先放在 `packages/core`，基础 UI 优先放在 `packages/base`，不要在 app 内重复实现已有公共能力。
- 修改用户可见文案时，注意 `apps/nuxt/i18n/locales` 下的多语言 JSON。

## 工作区注意事项

- 仓库当前可能存在未提交的用户改动，改文件前先看 `git status --short`。
- 不要回滚非本次任务产生的改动。
- `pnpm-workspace.yaml` 可能包含本地 install/build 审批配置，除非任务明确要求，不要随意改动。

