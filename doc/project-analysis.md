# TypeWords 项目完整分析文档

> 本文档面向前端初学者，逐步分析 TypeWords 项目的架构、技术栈、页面系统、组件关系、状态管理、API 请求等内容。

---

## 第一部分：项目整体结构

### 1. 技术栈总览

| 技术 | 版本/说明 | 作用 | 初学者理解 |
|------|-----------|------|------------|
| **Vue** | Vue 3.5 | 前端框架 | 用来构建用户界面的工具，把页面拆分成一个个"组件" |
| **TypeScript** | 5.9 | JavaScript 的超集 | 给 JavaScript 加上"类型检查"，防止你把数字当字符串用 |
| **Nuxt** | Nuxt 4 | Vue 的全栈框架 | 基于 Vue 的"脚手架"，帮你自动处理路由、构建、SSR 等 |
| **Pinia** | 3.0 | 状态管理 | 全局数据仓库，让不同页面共享数据 |
| **UnoCSS** | - | 原子化 CSS 框架 | 用简短的 class 名写样式，类似 Tailwind |
| **pnpm** | - | 包管理器 | 管理项目依赖（别人写的代码包） |
| **Vite** | 7.0 | 构建工具 | 把你的代码打包成浏览器能运行的文件 |
| **Vue Router** | 4.6 | 路由管理 | 决定哪个 URL 显示哪个页面（Nuxt 自动配置） |
| **vue-i18n** | 11.2 | 国际化 | 让网站支持多种语言（中/英/日/韩等 14 种） |
| **Axios** | 1.15 | HTTP 请求库 | 让前端能向后端服务器发送请求获取数据 |
| **Supabase** | - | 后端即服务 | 提供用户认证、数据库、数据同步功能 |
| **SCSS** | - | CSS 预处理器 | 让 CSS 支持变量、嵌套等高级写法 |

### 2. 项目类型判断

```
✅ 是 Monorepo（多包仓库）—— 多个项目共享在一个仓库里
✅ 使用 Nuxt 4（Vue 的全栈框架）—— 不是普通的 Vue 项目
✅ 有 SSR（服务端渲染）—— 但部分页面关闭了 SSR
✅ 使用 Pinia 管理状态 —— 全局数据仓库
✅ 使用 TypeScript —— 带类型检查的 JavaScript
❌ 不是传统的 Vue + Vue Router + Webpack 项目
```

> **什么是 Monorepo？**
> 想象一个大仓库，里面放了多个小项目。这些小项目可以互相引用代码，但各自独立。这样做的好处是：共享代码不用复制粘贴，改一处所有地方都生效。

### 3. 目录结构总览

```
TypeWords/                          # 项目根目录
├── apps/                           # 应用目录
│   └── nuxt/                       # 主 Web 应用（Nuxt 项目）
│       ├── app/                    # 前端代码
│       │   ├── pages/              # 📄 页面文件（Nuxt 自动识别为路由）
│       │   ├── components/         # 🧩 应用级组件
│       │   ├── layouts/            # 📐 布局模板
│       │   ├── assets/             # 🎨 静态资源（CSS、图片）
│       │   ├── plugins/            # 🔌 Nuxt 插件
│       │   └── app.vue             # 🚀 应用入口文件
│       ├── i18n/                   # 🌍 国际化翻译文件（14种语言）
│       ├── public/                 # 📁 公开静态资源（音频、词库等）
│       ├── server/                 # 🖥️ 服务端代码
│       └── nuxt.config.ts          # ⚙️ Nuxt 配置文件
│
├── packages/                       # 共享包目录
│   ├── core/                       # 📦 核心业务逻辑包
│   │   └── src/
│   │       ├── components/         # 业务组件（单词练习、文章练习等）
│   │       ├── stores/             # Pinia 状态管理
│   │       ├── hooks/              # 钩子函数（事件、发音等）
│   │       ├── composables/        # 组合式函数（可复用逻辑）
│   │       ├── apis/               # API 请求封装
│   │       ├── utils/              # 工具函数
│   │       ├── types/              # TypeScript 类型定义
│   │       └── config/             # 配置常量
│   │
│   ├── base/                       # 📦 基础 UI 组件库
│   │   └── src/
│   │       ├── BaseButton.vue      # 按钮
│   │       ├── BaseInput.vue       # 输入框
│   │       ├── BaseIcon.vue        # 图标
│   │       ├── Toast.vue           # 提示消息
│   │       ├── Dialog.vue          # 弹窗
│   │       └── ...                 # 更多基础组件
│   │
│   └── libs/                       # 📦 工具库
│       ├── translate/              # 翻译功能
│       └── qs.ts                   # 查询字符串工具
│
├── scripts/                        # 🔧 构建/部署脚本
├── docs/                           # 📚 文档
└── package.json                    # 根配置文件
```

### 4. 目录分类说明

#### 📄 页面目录（用户看到的页面）

| 目录 | 说明 |
|------|------|
| `apps/nuxt/app/pages/` | **主页面目录**，Nuxt 自动把 `.vue` 文件变成路由 |

#### 🧩 组件目录

| 目录 | 说明 |
|------|------|
| `apps/nuxt/app/components/` | 应用级组件（只在这个应用里用） |
| `packages/core/src/components/` | **核心业务组件**（单词练习、文章练习等，可被多个应用共享） |
| `packages/base/src/` | **基础 UI 组件**（按钮、输入框、弹窗等，最底层的积木） |

#### 🔧 业务逻辑目录

| 目录 | 说明 |
|------|------|
| `packages/core/src/composables/` | 组合式函数（可复用的状态逻辑，如数据同步） |
| `packages/core/src/hooks/` | 钩子函数（事件监听、发音播放、主题切换等） |
| `packages/core/src/apis/` | API 请求封装（与后端通信） |
| `packages/core/src/utils/` | 工具函数（通用的辅助功能） |

#### ⚙️ 配置目录

| 目录 | 说明 |
|------|------|
| `apps/nuxt/nuxt.config.ts` | Nuxt 主配置（路由规则、模块、SEO 等） |
| `apps/nuxt/uno.config.ts` | UnoCSS 配置 |
| `packages/core/src/config/env.ts` | 环境变量和常量配置 |

#### 📊 状态管理目录

| 目录 | 说明 |
|------|------|
| `packages/core/src/stores/` | Pinia 状态管理（全局数据仓库） |

### 5. 三个包的关系

```
┌─────────────────────────────────────────┐
│           apps/nuxt (应用层)             │
│  pages/ → 页面路由                       │
│  layouts/ → 布局                         │
│  components/ → 应用级组件                 │
└──────────────┬──────────────────────────┘
               │ 引用
┌──────────────▼──────────────────────────┐
│         packages/core (业务层)           │
│  components/ → 业务组件                  │
│  stores/ → 状态管理                      │
│  hooks/ → 钩子函数                       │
│  apis/ → API 请求                        │
│  composables/ → 组合式函数               │
└──────────────┬──────────────────────────┘
               │ 引用
┌──────────────▼──────────────────────────┐
│         packages/base (基础层)           │
│  BaseButton, BaseInput, Dialog, Toast   │
│  → 最基础的 UI 积木                      │
└─────────────────────────────────────────┘
```

> **为什么要分三层？**
> - **base** 是最底层的"积木"，不包含任何业务逻辑，可以在任何项目里复用
> - **core** 是业务逻辑层，包含这个项目特有的功能（单词练习、文章练习等）
> - **nuxt** 是最上层的应用，负责页面路由和布局，把 core 的组件组装成完整的页面

### 6. 初学者推荐阅读顺序

1. **先看 `apps/nuxt/app/app.vue`** → 理解应用入口
2. **再看 `apps/nuxt/app/layouts/default.vue`** → 理解页面布局
3. **然后看 `apps/nuxt/app/pages/`** → 了解有哪些页面
4. **接着看 `packages/core/src/stores/`** → 理解数据如何管理
5. **最后看 `packages/core/src/components/`** → 理解核心业务组件

---

## 第二部分：页面系统分析

### 1. Nuxt 的路由机制

> **传统 Vue 项目**：你需要手动在 `router/index.ts` 里写路由配置，告诉框架"哪个 URL 对应哪个页面"。
>
> **Nuxt 项目**：你只需要把 `.vue` 文件放在 `pages/` 目录下，Nuxt 会**自动**把文件路径变成 URL 路由。

这就是为什么你在项目里找不到 `router/index.ts` 文件——Nuxt 帮你做了这件事。

### 2. 文件路径 → URL 映射规则

```
pages/xxx.vue           →  /xxx
pages/xxx/index.vue     →  /xxx
pages/xxx/[id].vue      →  /xxx/:id  （动态路由，id 是变量）
pages/(group)/xxx.vue   →  /xxx      （括号只是分组，不影响 URL）
```

> **什么是动态路由？**
> 比如 `pages/(words)/practice-words/[id].vue` 中的 `[id]` 是一个"占位符"。
> 当你访问 `/practice-words/123` 时，`id` 的值就是 `"123"`。
> 这样一个页面文件就能处理无数个不同的 URL。

### 3. 项目所有页面总览

#### 单词相关页面（`(words)/` 分组）

| 页面名称 | 文件路径 | URL | 说明 |
|----------|----------|-----|------|
| 单词主页 | `pages/(words)/words.vue` | `/words` | 词典列表、学习进度 |
| 词典详情 | `pages/(words)/dict.vue` | `/dict` | 查看词典内容 |
| 词典列表 | `pages/(words)/dict-list.vue` | `/dict-list` | 所有可用词典 |
| 单词练习 | `pages/(words)/practice-words/[id].vue` | `/practice-words/:id` | 核心：单词跟打练习 |
| 单词测试 | `pages/(words)/words-test/[id].vue` | `/words-test/:id` | 单词测试模式 |

#### 文章相关页面（`(articles)/` 分组）

| 页面名称 | 文件路径 | URL | 说明 |
|----------|----------|-----|------|
| 文章主页 | `pages/(articles)/articles.vue` | `/articles` | 文章书籍列表 |
| 书籍列表 | `pages/(articles)/book-list.vue` | `/book-list` | 所有可用书籍 |
| 书籍详情 | `pages/(articles)/book/[id].vue` | `/book/:id` | 查看书籍内容 |
| 书籍首页 | `pages/(articles)/book/index.vue` | `/book` | 书籍入口 |
| 文章练习 | `pages/(articles)/practice-articles/[id].vue` | `/practice-articles/:id` | 核心：文章跟打练习 |
| 批量编辑 | `pages/(articles)/batch-edit-article.vue` | `/batch-edit-article` | 批量编辑文章 |

#### 用户相关页面（`(user)/` 分组）

| 页面名称 | 文件路径 | URL | 说明 |
|----------|----------|-----|------|
| 登录页 | `pages/(user)/login.vue` | `/login` | 用户登录/注册 |
| 用户中心 | `pages/(user)/user.vue` | `/user` | 用户信息 |
| VIP 页面 | `pages/(user)/vip.vue` | `/vip` | 会员功能 |

#### 其他页面

| 页面名称 | 文件路径 | URL | 说明 |
|----------|----------|-----|------|
| 设置页 | `pages/setting.vue` | `/setting` | 应用设置 |
| 帮助页 | `pages/help.vue` | `/help` | 使用帮助 |
| 文档页 | `pages/doc.vue` | `/doc` | 项目文档 |
| 反馈页 | `pages/feedback.vue` | `/feedback` | 用户反馈 |
| FSRS 页 | `pages/fsrs.vue` | `/fsrs` | 间隔重复算法测试 |
| NCE 页 | `pages/nce.vue` | `/nce` | 新概念英语入口 |
| 测试页 | `pages/test.vue` | `/test` | 开发测试用 |
| 录屏页 | `pages/rrweb.vue` | `/rrweb` | 操作录屏回放 |

### 4. 路由重定向

在 `nuxt.config.ts` 中配置了：

```typescript
routeRules: {
  '/': { redirect: '/word' },    // 访问首页自动跳转到 /word
  '/word': { ssr: false },       // 关闭 SSR（纯客户端渲染）
  '/words': { ssr: false },
  '/articles': { ssr: false },
  '/setting': { ssr: false },
}
```

> **为什么有些页面关闭 SSR？**
> SSR（服务端渲染）是指服务器先生成好 HTML 再发给浏览器。这对 SEO 有好处。
> 但像单词练习这种高度交互的页面，SSR 意义不大，关闭它可以加快加载速度。

### 5. 页面之间的跳转方式

在 Nuxt 中，页面跳转使用 `<NuxtLink>` 组件（相当于 Vue Router 的 `<router-link>`）：

```vue
<!-- 在 default.vue 布局中 -->
<NuxtLink to="/word" class="row">
  <IconFluentTextUnderlineDouble20Regular />
  <span>{{ $t('words') }}</span>
</NuxtLink>
<NuxtLink to="/articles" class="row">
  <IconFluentBookLetter20Regular />
  <span>{{ $t('articles') }}</span>
</NuxtLink>
```

也可以用代码跳转：

```typescript
const router = useRouter()
router.push('/setting')  // 跳转到设置页
```

### 6. 括号分组 `(xxx)` 的作用

```
pages/
├── (words)/                # 括号只是逻辑分组，不影响 URL
│   ├── words.vue           # → /words
│   ├── dict.vue            # → /dict
│   └── practice-words/
│       └── [id].vue        # → /practice-words/:id
├── (articles)/             # 同样只是分组
│   ├── articles.vue        # → /articles
│   └── practice-articles/
│       └── [id].vue        # → /practice-articles/:id
```

> **为什么要用括号分组？**
> 纯粹是为了**文件组织**，让开发者更容易找到相关文件。括号里的名字不会出现在 URL 中。

---

## 第三部分：从"页面打开"开始分析执行流程

### 1. 浏览器打开页面的完整流程

```
用户输入 URL（如 https://typewords.cc/words）
        │
        ▼
┌─────────────────────────────┐
│  1. Nuxt 服务器接收请求       │
│  （如果是 SSR 页面，服务器     │
│   会先渲染一次 HTML）         │
│  （如果是 CSR 页面，直接返回   │
│   空壳 HTML）                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  2. 浏览器加载 HTML           │
│  → 加载 app.vue              │
│  → NuxtLayout 包裹 NuxtPage  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  3. layouts/default.vue 生效 │
│  → 渲染左侧导航栏            │
│  → 渲染顶部工具栏            │
│  → <slot> 插入页面内容        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  4. pages/(words)/words.vue  │
│  → 根据 URL 路由加载对应页面  │
│  → 页面组件开始渲染           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  5. useInit() 执行           │
│  → 从 IndexedDB 读取本地数据  │
│  → 初始化 Pinia stores       │
│  → 从服务器同步数据           │
│  → 开启数据变化监听           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  6. 页面渲染完成              │
│  → 用户可以开始使用           │
└─────────────────────────────┘
```

### 2. app.vue — 应用入口

```vue
<!-- apps/nuxt/app/app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

这个文件只有 5 行代码，但它是整个应用的**入口**：
- `<NuxtLayout>`：加载布局（默认是 `layouts/default.vue`）
- `<NuxtPage>`：加载当前 URL 对应的页面组件

> **为什么这么简单？**
> Nuxt 的设计哲学是"约定优于配置"。你不需要写大量配置代码，只需要按照约定放文件，框架自动帮你处理。

### 3. layouts/default.vue — 布局文件

这是所有页面共享的"外壳"，包含：

```
┌──────────────────────────────────────────────┐
│  ┌────────┐  ┌────────────────────────────┐  │
│  │        │  │  右上角：翻译/主题切换       │  │
│  │  左侧  │  │                            │  │
│  │  导航  │  │     页面内容（slot）         │  │
│  │  栏    │  │     words.vue / articles.vue│  │
│  │        │  │     等等                    │  │
│  └────────┘  └────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

布局文件做了这些事：
1. **渲染左侧导航栏**：单词、文章、设置、反馈、文档、帮助
2. **渲染移动端顶部菜单**：小屏幕时自动切换
3. **初始化应用**：调用 `useInit()` 加载数据
4. **监听主题变化**：切换亮/暗主题
5. **监听语言变化**：切换 14 种语言

### 4. useInit() — 初始化流程

这是应用启动时最重要的函数：

```typescript
// packages/core/src/composables/useInit.ts
export function useInit() {
  async function init() {
    // 1. 确保数据哈希检查通过
    await ensureHashGuardBeforeInit()

    // 2. 初始化 base store（加载词典、书籍数据）
    let dictData = await store.init()

    // 3. 初始化 setting store（加载设置数据）
    let settingData = await settingStore.init()

    // 4. 如果有数据，与服务器同步
    if (dictData && settingData) {
      await dataSync.syncData({...})
    }

    // 5. 标记加载完成
    settingStore.load = true
    store.load = true

    // 6. 开启数据变化监听（自动保存）
    store.$subscribe(debounce(async (mutation, data) => {
      await dataSync.saveDictState(data)
    }, 1000))

    settingStore.$subscribe(debounce(async (mutation, data) => {
      await dataSync.saveLocalAndSync(SyncDataType.setting, data)
    }, 1000))
  }
}
```

> **数据流向**：
> ```
> IndexedDB（本地数据库）
>     ↓ 读取
> Pinia Store（内存中的状态）
>     ↓ 同步
> Supabase（云端数据库）
>     ↓ 监听变化
> Pinia Store 变化 → 自动保存到 IndexedDB + 同步到云端
> ```

### 5. 页面数据加载流程

以 `words.vue`（单词主页）为例：

```
words.vue 加载
    │
    ├─ useBaseStore()     → 获取词典列表、学习进度
    ├─ useSettingStore()  → 获取用户设置
    ├─ useRuntimeStore()  → 获取运行时状态
    │
    ├─ useFetch(url)      → 从服务器获取词典列表 JSON
    │
    └─ 渲染页面
        ├─ 显示词典列表
        ├─ 显示学习进度
        └─ 显示操作按钮
```

---

## 第四部分：Vue 文件详细教学

### Vue 文件的基本结构

每个 `.vue` 文件由三部分组成：

```vue
<script setup lang="ts">
// 1. 逻辑部分（JavaScript/TypeScript）
// 定义变量、函数、生命周期等
</script>

<template>
<!-- 2. 模板部分（HTML） -->
<!-- 定义页面结构，使用 Vue 指令 -->
</template>

<style scoped lang="scss">
/* 3. 样式部分（CSS/SCSS） */
/* 定义页面样式 */
</style>
```

### 以 layouts/default.vue 为例

#### 1. 这个文件的作用

它是 **Layout（布局）文件**，是所有页面共享的"外壳"。

#### 2. script 部分解析

```typescript
<script setup lang="ts">
// 导入需要的组件和工具
import { BaseIcon, ToastComponent } from '@typewords/base'  // 从基础组件库导入
import Logo from '@typewords/core/components/Logo.vue'       // 从核心包导入 Logo 组件
import { useRuntimeStore } from '@typewords/core/stores/runtime.ts'  // 导入 store
import { useSettingStore } from '@typewords/core/stores/setting.ts'
import { onMounted, watch } from 'vue'  // Vue 的生命周期和监听函数
import { useRoute, useRouter } from 'vue-router'  // 路由相关

// 获取路由实例（可以用来跳转页面）
const router = useRouter()
const route = useRoute()

// 获取 store 实例（全局状态）
const runtimeStore = useRuntimeStore()
const settingStore = useSettingStore()

// 使用组合式函数
const init = useInit()  // 初始化函数

// 监听设置变化
watch(() => settingStore.sideExpand, toggleExpand)

// 生命周期：组件挂载后执行
onMounted(() => {
  init()  // 初始化应用数据
})
</script>
```

> **`<script setup>` 是什么？**
> 这是 Vue 3 的"组合式 API"写法。`setup` 关键字表示这部分代码在组件创建时执行。
> 与旧的 `export default { data(), methods() }` 写法相比，更简洁、更灵活。

#### 3. template 部分解析

```vue
<template>
  <div class="layout anim">
    <!-- 左侧导航栏占位（让主内容不被导航栏遮挡） -->
    <div class="aside space"></div>

    <!-- 左侧导航栏（固定定位） -->
    <div class="aside anim fixed">
      <div class="top" :class="!expand && 'hidden-span'">
        <!-- Logo（展开时显示） -->
        <Logo v-if="expand" />

        <!-- 导航链接 -->
        <NuxtLink to="/word" class="row">
          <IconFluentTextUnderlineDouble20Regular />  <!-- 图标组件 -->
          <span>{{ $t('words') }}</span>  <!-- 国际化文本 -->
        </NuxtLink>

        <NuxtLink to="/articles" class="row">
          <IconFluentBookLetter20Regular />
          <span>{{ $t('articles') }}</span>
        </NuxtLink>

        <!-- 更多导航项... -->
      </div>

      <!-- 底部：展开/收起按钮 -->
      <div class="bottom flex justify-evenly">
        <BaseIcon @click="settingStore.sideExpand = !settingStore.sideExpand">
          <IconFluentChevronLeft20Filled v-if="expand" />
          <IconFluentChevronLeft20Filled class="transform-rotate-180" v-else />
        </BaseIcon>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 z-1 relative main-content overflow-x-hidden">
      <router-view></router-view>  <!-- 页面内容渲染在这里 -->
    </div>
  </div>
</template>
```

> **常用 Vue 指令解释**：
> - `v-if="expand"`：如果 `expand` 为 `true`，才渲染这个元素
> - `v-else`：与 `v-if` 配合，条件为假时渲染
> - `:class="!expand && 'hidden-span'"`：动态绑定 class（简写 `:class` = `v-bind:class`）
> - `@click="..."`：点击事件（简写 `@` = `v-on:`）
> - `{{ $t('words') }}`：插值表达式，显示国际化翻译后的文本
> - `<router-view>`：页面内容的"插槽"，当前路由对应的页面组件会渲染在这里

#### 4. style 部分解析

```scss
<style scoped lang="scss">
// scoped 表示样式只对当前组件生效，不会影响其他组件
// lang="scss" 表示使用 SCSS 语法（支持嵌套、变量等）

.layout {
  width: 100%;
  height: 100%;
  display: flex;  // 使用 flex 布局
  background: var(--color-primary);  // CSS 变量（主题色）
}

.aside {
  background: var(--color-second);
  width: var(--aside-width);  // 导航栏宽度（可通过 JS 动态修改）

  .row {
    // SCSS 嵌套写法，等价于 .aside .row
    @apply cp rounded-md text p-2 my-2 ...;  // UnoCSS 的 @apply 指令
    color: var(--color-main-text);

    &.router-link-active {
      // & 代表父选择器，即 .row
      // 当链接被激活时（当前页面），添加背景色
      background: var(--color-fourth);
    }
  }
}

// 媒体查询：响应式设计
@media (max-width: 768px) {
  .aside {
    display: none;  // 小屏幕隐藏左侧导航栏
  }
}
</style>
```

> **`scoped` 是什么？**
> 默认情况下，CSS 是全局的。加了 `scoped`，Vue 会给每个选择器加上唯一标识，确保样式只影响当前组件。
> 这样你在 `default.vue` 写的 `.row` 样式不会影响其他组件里的 `.row`。

---

## 第五部分：组件关系分析

### 1. 组件树总览

```
app.vue
└── NuxtLayout
    └── layouts/default.vue          ← 布局（所有页面共享）
        ├── Logo                     ← Logo 组件
        ├── NuxtLink × 6            ← 导航链接
        ├── BaseIcon                 ← 基础图标组件
        ├── MigrateDialog            ← 数据迁移弹窗
        ├── IeDialog                 ← IE 浏览器提示弹窗
        ├── ToastComponent           ← 提示消息组件
        ├── MiniProgram              ← 小程序组件
        └── <router-view>            ← 页面内容插槽
            │
            ├── pages/(words)/words.vue      ← 单词主页
            │   ├── BaseButton, BasePage, Calendar, Progress
            │   ├── Book                      ← 书籍组件
            │   ├── PracticeSettingDialog     ← 练习设置弹窗
            │   └── ChangeLastPracticeIndexDialog
            │
            ├── pages/(words)/practice-words/[id].vue  ← 单词练习页
            │   ├── TypeWord                  ← 核心：单词输入组件
            │   ├── Statistics                ← 统计组件
            │   ├── Footer                    ← 底部组件
            │   ├── Panel                     ← 面板组件
            │   ├── WordList                  ← 单词列表
            │   ├── GroupList                 ← 分组列表
            │   ├── PracticeLayout            ← 练习布局
            │   └── WordMarkPickList          ← 单词标记列表
            │
            ├── pages/(articles)/articles.vue  ← 文章主页
            │   ├── Book
            │   └── 各种弹窗组件
            │
            ├── pages/(articles)/practice-articles/[id].vue  ← 文章练习页
            │   ├── TypingArticle             ← 核心：文章输入组件
            │   ├── TypingWord                ← 单词输入组件
            │   └── ArticleAudio              ← 文章音频组件
            │
            └── pages/setting.vue             ← 设置页
                ├── CommonSetting             ← 通用设置
                ├── WordSetting               ← 单词设置
                ├── ArticleSetting            ← 文章设置
                ├── SoundSetting              ← 声音设置
                ├── FsrsSetting               ← FSRS 算法设置
                └── Log                       ← 日志组件
```

### 2. 组件分类

#### 基础组件（packages/base）— 不含业务逻辑的"积木"

| 组件 | 说明 |
|------|------|
| `BaseButton` | 按钮 |
| `BaseInput` | 输入框 |
| `BaseIcon` | 图标容器 |
| `BasePage` | 页面容器 |
| `Dialog` | 弹窗 |
| `Toast` / `ToastComponent` | 提示消息 |
| `Form` / `FormItem` | 表单 |
| `Progress` | 进度条 |
| `Calendar` | 日历 |
| `Slider` | 滑块 |
| `Switch` | 开关 |
| `Tooltip` | 工具提示 |

#### 业务组件（packages/core）— 包含业务逻辑

| 组件 | 说明 |
|------|------|
| `TypeWord` | **核心**：单词输入练习组件 |
| `TypingArticle` | **核心**：文章输入练习组件 |
| `TypingWord` | 文章中的单词输入组件 |
| `Statistics` | 学习统计 |
| `Book` | 书籍/词典展示 |
| `Logo` | 应用 Logo |
| `Panel` | 侧边面板 |
| `PracticeLayout` | 练习页面布局 |
| `Header` | 页头 |
| `Footer` | 页脚 |

#### 弹窗组件（packages/core/components/dialog）

| 组件 | 说明 |
|------|------|
| `MigrateDialog` | 数据迁移弹窗 |
| `IeDialog` | IE 浏览器提示 |
| `ConflictNotice` | 数据冲突提示 |
| `BackupGateDialog` | 备份确认弹窗 |
| `CollectNotice` | 收藏提示 |

#### 设置组件（packages/core/components/setting）

| 组件 | 说明 |
|------|------|
| `CommonSetting` | 通用设置（主题、语言等） |
| `WordSetting` | 单词练习设置 |
| `ArticleSetting` | 文章练习设置 |
| `SoundSetting` | 声音设置 |
| `FsrsSetting` | FSRS 间隔重复算法设置 |

### 3. Props 传递关系

```
words.vue (页面)
  │
  │  :dict="currentDict"          传递词典数据
  │  :words="currentWords"        传递单词列表
  │  :index="currentIndex"        传递当前索引
  ▼
TypeWord.vue (组件)
  │
  │  :word="currentWord"          传递当前单词
  │  @next="handleNext"           触发"下一个"事件
  │  @correct="handleCorrect"     触发"正确"事件
  │  @wrong="handleWrong"         触发"错误"事件
  ▼
用户输入 → 处理逻辑 → 更新 store
```

### 4. Emit 事件关系

```
TypeWord.vue
  │
  ├─ @next        → 用户完成当前单词，切换到下一个
  ├─ @correct     → 用户输入正确
  ├─ @wrong       → 用户输入错误
  ├─ @skip        → 用户跳过当前单词
  └─ @collect     → 用户收藏当前单词
```

---

## 第六部分：状态管理分析（Pinia）

### 1. Pinia 是什么？

> **简单理解**：Pinia 是一个"全局数据仓库"。
> 想象一个超市的中央仓库，所有分店（页面）都可以从中取货（读取数据）、存入货物（修改数据）。
> 这样所有分店看到的数据都是同步的。

### 2. 项目中的 Store 总览

项目有 5 个 Store：

```
packages/core/src/stores/
├── index.ts        # 导出所有 store
├── base.ts         # 核心数据：词典、书籍、学习进度
├── setting.ts      # 用户设置：声音、主题、快捷键等
├── runtime.ts      # 运行时状态：弹窗、加载状态等
├── practice.ts     # 练习状态：当前阶段、统计等
└── user.ts         # 用户信息：登录状态、用户资料等
```

### 3. 每个 Store 详解

#### base.ts — 核心数据仓库

```typescript
export interface BaseState {
  simpleWords: string[]       // 简单词列表（不需要练习的词）
  load: boolean               // 是否加载完成
  word: {
    studyIndex: number        // 当前学习的词典索引
    bookList: Dict[]          // 词典列表（包含收藏、错词、已掌握等）
  }
  article: {
    bookList: Dict[]          // 书籍列表
    studyIndex: number        // 当前学习的书籍索引
  }
  dictListVersion: number     // 词典列表版本号
  fsrsData: Record<string, Card>  // FSRS 间隔重复数据
}
```

> **存储了什么？** 所有词典和书籍的数据，包括用户的学习进度、收藏的单词、错词等。

#### setting.ts — 用户设置仓库

```typescript
export interface SettingState {
  soundType: string                    // 发音类型（美式/英式）
  wordSound: boolean                   // 是否播放单词发音
  wordSoundVolume: number              // 单词发音音量
  keyboardSound: boolean               // 是否播放键盘音效
  keyboardSoundFile: string            // 键盘音效文件
  repeatCount: number                  // 重复次数
  dictation: boolean                   // 是否默写模式
  translate: boolean                   // 是否显示翻译
  ignoreCase: boolean                  // 是否忽略大小写
  theme: string                        // 主题（light/dark/auto）
  shortcutKeyMap: Record<string, string>  // 快捷键映射
  fontSize: { ... }                    // 字体大小设置
  japanesePracticeInputMode: 'kanji' | 'romaji'  // 日语输入模式
  // ... 更多设置
}
```

> **存储了什么？** 用户的所有个性化设置，从音量到主题到快捷键。

#### runtime.ts — 运行时状态仓库

```typescript
export interface RuntimeState {
  disableEventListener: boolean    // 是否禁用键盘事件监听
  modalList: Array<...>            // 打开的弹窗列表
  editDict: Dict                   // 正在编辑的词典
  showDictModal: boolean           // 是否显示词典弹窗
  isNew: boolean                   // 是否有新版本
  isError: boolean                 // 是否有错误
  globalLoading: boolean           // 全局加载状态
}
```

> **存储了什么？** 应用运行时的临时状态，不需要持久化保存。

#### practice.ts — 练习状态仓库

```typescript
export interface PracticeState {
  stage: WordPracticeStage     // 当前练习阶段
  startDate: number            // 开始时间
  spend: number                // 花费时间
  total: number                // 总单词数
  newWordNumber: number        // 新词数量
  reviewWordNumber: number     // 复习词数量
  wrong: number                // 错误次数
  timerPaused: boolean         // 计时器是否暂停
  segments: [number, number][] // 学习时间片段
}
```

> **存储了什么？** 当前练习会话的实时状态。

#### user.ts — 用户信息仓库

```typescript
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)    // 用户信息
  const isLogin = ref<boolean>(false)    // 是否登录

  const setToken = (newToken: string) => { ... }  // 设置 token
  const clearToken = () => { ... }                 // 清除 token
  const logout = () => { ... }                     // 登出
  const fetchUserInfo = async () => { ... }        // 获取用户信息
})
```

> **存储了什么？** 用户的登录状态和个人信息。

### 4. Store 的使用方式

```vue
<script setup lang="ts">
import { useBaseStore } from '@typewords/core/stores/base'
import { useSettingStore } from '@typewords/core/stores/setting'

// 获取 store 实例
const store = useBaseStore()
const settingStore = useSettingStore()

// 读取数据
console.log(store.word.bookList)        // 获取词典列表
console.log(settingStore.theme)         // 获取主题设置

// 修改数据
settingStore.theme = 'dark'             // 直接修改
settingStore.setState({ theme: 'dark' }) // 批量修改
</script>
```

### 5. 为什么这样设计？

| 数据类型 | 放在哪里 | 原因 |
|----------|----------|------|
| 词典/书籍数据 | base store | 多个页面需要访问，且需要持久化 |
| 用户设置 | setting store | 全局共享，需要持久化 |
| 运行时状态 | runtime store | 只在当前会话有效，不需要持久化 |
| 练习状态 | practice store | 每次练习独立，练习结束后重置 |
| 用户信息 | user store | 登录状态全局共享 |

---

## 第七部分：API 请求分析

### 1. API 请求封装位置

```
packages/core/src/apis/
├── index.ts      # 主要 API（词典、设置相关）
├── base.ts       # 基础 API（词典操作）
├── dict.ts       # 词典 API
├── user.ts       # 用户 API
└── member.ts     # 会员 API
```

### 2. HTTP 请求工具

```typescript
// packages/core/src/utils/http.ts
import axios from 'axios'

// 创建 axios 实例
export const axiosInstance = axios.create({
  timeout: 15000,  // 超时时间 15 秒
})

// 请求拦截器：每次请求前自动执行
axiosInstance.interceptors.request.use(config => {
  if (AppEnv.CAN_REQUEST) {
    config.headers.token = AppEnv.TOKEN  // 自动添加 token
  }
  return config
})

// 响应拦截器：每次响应后自动执行
axiosInstance.interceptors.response.use(
  response => {
    const { data } = response
    if (response.status !== 200) {
      Toast.warning(response.statusText)  // 显示错误提示
      return Promise.reject(data)
    }
    return Promise.resolve(data)
  },
  error => {
    // 统一错误处理
    if (error.response.status >= 500) {
      return Promise.resolve({ code: 500, msg: '服务器出现错误' })
    }
    if (error.response.status === 401) {
      return Promise.resolve({ code: 500, msg: '用户名或密码不正确' })
    }
    // ...
  }
)

// 封装的请求函数
async function request<T>(url, data, params, method): Promise<AxiosResponse<T>> {
  return axiosInstance({ url, method, data, params })
}
```

### 3. API 函数示例

```typescript
// packages/core/src/apis/index.ts

// 获取词典列表版本号
export function dictListVersion() {
  return http<number>('dict/dictListVersion', null, null, 'get')
}

// 获取我的词典列表
export function myDictList(params?) {
  return http('dict/myDictList', null, params, 'get')
}

// 添加到我的词典
export function add2MyDict(data) {
  return http<number>('dict/add2MyDict', remove(data), null, 'post')
}

// 同步设置
export function syncSetting(params?, data?) {
  return http<Dict>('dict/syncSetting', remove(data), remove(params), 'post')
}
```

### 4. 数据流：从页面到服务器

```
页面组件（如 words.vue）
    │
    │  调用 API 函数
    ▼
API 层（apis/index.ts）
    │
    │  调用 http() 函数
    ▼
HTTP 工具（utils/http.ts）
    │
    │  请求拦截器自动添加 token
    │  调用 axios 发送请求
    ▼
axios
    │
    │  发送 HTTP 请求到服务器
    ▼
服务器（后端 API）
    │
    │  处理请求，返回数据
    ▼
响应拦截器
    │
    │  统一处理错误
    │  返回标准化的数据格式
    ▼
API 层
    │
    │  返回 { code, data, success, msg }
    ▼
页面组件
    │
    │  更新 store 或页面状态
    ▼
页面重新渲染
```

### 5. 数据同步机制

项目使用了**本地优先 + 云端同步**的策略：

```
┌─────────────────────────────────────────────┐
│                 数据同步流程                  │
├─────────────────────────────────────────────┤
│                                             │
│  1. 应用启动                                │
│     → 从 IndexedDB 读取本地数据              │
│     → 从 Supabase 读取云端数据               │
│     → 比较时间戳，取最新的数据                │
│                                             │
│  2. 用户操作                                │
│     → 修改 Pinia store                      │
│     → $subscribe 监听到变化                  │
│     → 保存到 IndexedDB（本地）               │
│     → 同步到 Supabase（云端）                │
│                                             │
│  3. 页面切换/窗口聚焦                        │
│     → 重新从云端拉取最新数据                  │
│     → 合并本地和云端数据                     │
│                                             │
└─────────────────────────────────────────────┘
```

> **为什么用 IndexedDB？**
> IndexedDB 是浏览器内置的本地数据库，可以存储大量数据（比 localStorage 大得多）。
> 这样即使用户离线，也能正常使用应用，数据不会丢失。

---

## 第八部分：TypeScript 教学

### 1. 项目中常见的 TypeScript 语法

#### interface（接口）

```typescript
// 定义一个"形状"，规定对象必须有哪些属性
export interface Word {
  id?: string           // ? 表示可选
  word: string          // 必填
  phonetic0: string     // 音标
  trans: {              // 嵌套对象
    pos: string         // 词性
    cn: string          // 中文翻译
  }[]                   // 数组
}
```

> **interface 是什么？**
> 就像一份"合同"或"规格书"，规定一个对象必须有哪些属性、每个属性是什么类型。
> 如果你写的对象不符合这个"合同"，TypeScript 会在编译时报错。

#### type（类型别名）

```typescript
// 给类型起一个别名
export type LanguageType = 'en' | 'ja' | 'de' | 'code'

// 联合类型：只能是这几个值之一
export type TranslateLanguageType = 'en' | 'zh-CN' | 'ja' | 'de' | 'common' | ''
```

> **interface 和 type 的区别？**
> - `interface` 主要用来定义对象的形状
> - `type` 更灵活，可以定义联合类型、交叉类型等
> - 在实际使用中，它们经常可以互换

#### enum（枚举）

```typescript
// 定义一组命名常量
export enum WordPracticeMode {
  System = 0,           // 系统模式
  Free = 1,             // 自由练习
  IdentifyOnly = 2,     // 仅自测
  DictationOnly = 3,    // 仅默写
  ListenOnly = 4,       // 仅听写
  Shuffle = 5,          // 随机复习
}

// 使用
if (mode === WordPracticeMode.System) {
  // 执行系统模式逻辑
}
```

> **enum 是什么？**
> 就是一组有名字的常量。比直接用数字 0、1、2 更易读。
> 比起写 `if (mode === 0)`，写 `if (mode === WordPracticeMode.System)` 更清楚。

#### 泛型

```typescript
// 泛型：让函数/类型可以处理多种类型的数据
export type AxiosResponse<T> = {
  code: number
  data: T        // T 是一个"占位符"，调用时替换成具体类型
  success: boolean
  msg: string
}

// 使用时指定 T 的类型
export function dictListVersion() {
  return http<number>('dict/dictListVersion', ...)  // T = number
}

export function detail() {
  return http<Dict>('dict/detail', ...)  // T = Dict
}
```

> **泛型是什么？**
> 就像一个"模板"，你可以用它来创建不同类型的版本。
> 就像一个模具，可以做出不同口味的蛋糕，但形状是一样的。

#### Record

```typescript
// Record<K, V> 创建一个对象类型，键是 K 类型，值是 V 类型
shortcutKeyMap: Record<string, string>
// 等价于 { [key: string]: string }
// 例如：{ "ToggleTheme": "Ctrl+Q", "Next": "Ctrl+➡" }

fsrsData: Record<string, Card>
// 例如：{ "apple": Card, "banana": Card }
```

#### Partial

```typescript
// Partial<T> 将 T 的所有属性变为可选
interface User {
  name: string
  age: number
}

type PartialUser = Partial<User>
// 等价于 { name?: string; age?: number }
```

#### keyof

```typescript
// keyof 获取对象类型的所有键名
interface User {
  name: string
  age: number
}

type UserKeys = keyof User  // "name" | "age"
```

#### extends（泛型约束）

```typescript
// 限制泛型的范围
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key]
}

// K 必须是 T 的键名之一
```

### 2. 项目中的实际类型示例

```typescript
// 词典类型 — 包含了词典的所有信息
export interface Dict extends DictResource {
  lastLearnIndex: number       // 上次学到的索引
  perDayStudyNumber: number    // 每天学习的单词数
  words: Word[]                // 单词列表
  articles: Article[]          // 文章列表
  statistics: Statistics[]     // 学习统计
  custom: boolean              // 是否自定义词典
  complete: boolean            // 是否学完
}

// 练习数据类型 — 练习过程中的状态
export interface PracticeData {
  index: number                // 当前索引
  words: Word[]                // 单词列表
  wrongWords: Word[]           // 错词列表
  wrongTimes: number           // 错误次数
  wrongTimesMap: Record<string, number>  // 每个词的错误次数
  ratingMap: Record<string, Rating>      // 每个词的评分
  question: Question           // 当前题目
}

// 保存数据类型 — 持久化存储的格式
export interface SaveData {
  val: any                     // 实际数据
  version: number              // 数据版本号
  updated_at?: string          // 更新时间
}
```

### 3. TypeScript 的价值

| 没有 TypeScript | 有 TypeScript |
|----------------|---------------|
| `user.name` 可能是 undefined，运行时才发现 | 编译时就告诉你 `name` 可能不存在 |
| 把数字当字符串用，运行时出 bug | 编译时就报类型错误 |
| 不知道函数需要什么参数 | IDE 自动提示参数类型 |
| 重构代码时到处改，容易遗漏 | 改了类型，所有引用的地方自动报错 |

---

## 附录：关键文件快速索引

### 入口文件

| 文件 | 作用 |
|------|------|
| `apps/nuxt/app/app.vue` | 应用入口，只有 5 行代码 |
| `apps/nuxt/app/layouts/default.vue` | 默认布局，包含导航栏 |
| `apps/nuxt/app/layouts/empty.vue` | 空布局，只有 `<slot>` |
| `apps/nuxt/nuxt.config.ts` | Nuxt 配置文件 |

### 核心页面

| 文件 | URL | 作用 |
|------|-----|------|
| `pages/(words)/words.vue` | `/words` | 单词主页 |
| `pages/(words)/practice-words/[id].vue` | `/practice-words/:id` | 单词练习 |
| `pages/(articles)/articles.vue` | `/articles` | 文章主页 |
| `pages/(articles)/practice-articles/[id].vue` | `/practice-articles/:id` | 文章练习 |
| `pages/setting.vue` | `/setting` | 设置页 |

### 核心组件

| 文件 | 作用 |
|------|------|
| `packages/core/src/components/word/TypeWord.vue` | 单词输入组件 |
| `packages/core/src/components/article/TypingArticle.vue` | 文章输入组件 |
| `packages/core/src/components/Panel.vue` | 侧边面板 |
| `packages/core/src/components/PracticeLayout.vue` | 练习布局 |

### 状态管理

| 文件 | Store 名 | 作用 |
|------|----------|------|
| `packages/core/src/stores/base.ts` | `useBaseStore` | 词典、书籍、学习进度 |
| `packages/core/src/stores/setting.ts` | `useSettingStore` | 用户设置 |
| `packages/core/src/stores/runtime.ts` | `useRuntimeStore` | 运行时状态 |
| `packages/core/src/stores/practice.ts` | `usePracticeStore` | 练习状态 |
| `packages/core/src/stores/user.ts` | `useUserStore` | 用户信息 |

### 核心逻辑

| 文件 | 作用 |
|------|------|
| `packages/core/src/composables/useInit.ts` | 应用初始化 |
| `packages/core/src/composables/useDataSyncPersistence.ts` | 数据同步 |
| `packages/core/src/hooks/event.ts` | 键盘事件处理 |
| `packages/core/src/hooks/sound.ts` | 发音播放 |
| `packages/core/src/hooks/theme.ts` | 主题切换 |
| `packages/core/src/hooks/fsrs.ts` | 间隔重复算法 |
| `packages/core/src/utils/http.ts` | HTTP 请求封装 |

### 配置和类型

| 文件 | 作用 |
|------|------|
| `packages/core/src/config/env.ts` | 环境变量和常量 |
| `packages/core/src/types/types.ts` | 核心类型定义 |
| `packages/core/src/types/enum.ts` | 枚举类型定义 |

---

## 附录：技术名词速查表

| 名词 | 解释 |
|------|------|
| **SSR** | Server Side Rendering，服务端渲染。服务器先生成 HTML 再发给浏览器 |
| **CSR** | Client Side Rendering，客户端渲染。浏览器下载空 HTML，然后用 JavaScript 渲染 |
| **SPA** | Single Page Application，单页应用。只有一个 HTML 页面，通过 JavaScript 切换内容 |
| **SFC** | Single File Component，单文件组件。`.vue` 文件就是 SFC |
| **Composition API** | Vue 3 的组合式 API，用 `setup` 函数组织代码 |
| **Options API** | Vue 2 的选项式 API，用 `data/methods/computed` 组织代码 |
| **Pinia** | Vue 的状态管理库，替代 Vuex |
| **Store** | 状态仓库，存放全局共享的数据 |
| **Composable** | 组合式函数，以 `use` 开头的可复用逻辑 |
| **Hook** | 钩子，特定时机执行的函数 |
| **Scoped CSS** | 作用域 CSS，只对当前组件生效 |
| **Atomic CSS** | 原子化 CSS，每个 class 只做一件事（如 `p-2` = padding: 0.5rem） |
| **IndexedDB** | 浏览器内置的本地数据库，可存储大量结构化数据 |
| **Supabase** | 开源的后端即服务（BaaS），提供数据库、认证等功能 |
| **FSRS** | Free Spaced Repetition Scheduler，间隔重复算法，用于优化记忆 |
| **TTS** | Text To Speech，文字转语音 |
| **IME** | Input Method Editor，输入法（如中文输入法、日文输入法） |
