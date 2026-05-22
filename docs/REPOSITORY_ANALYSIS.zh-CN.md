# TypeWords 仓库结构与核心代码分析

生成日期：2026-05-20

## 1. 项目定位

TypeWords 是一个基于 `pnpm workspace` 的 TypeScript/Vue monorepo，用于英语单词、文章跟打、听写、自测和学习进度管理。仓库同时提供：

- 官网与主 Web 应用：`apps/nuxt`
- VS Code WebView 嵌入应用：`apps/vscode-web`
- VS Code 扩展壳：`apps/vscode`
- 共享业务逻辑与页面组件：`packages/core`
- 基础 UI 组件库：`packages/base`
- 翻译与通用库：`packages/libs`

仓库中 `apps` 与 `packages` 下约有 452 个文件，其中 TypeScript 文件约 107 个，Vue SFC 文件约 139 个，JavaScript 文件约 24 个。

## 2. 目录结构分析

```text
.
├── apps
│   ├── nuxt             # Nuxt 4 主站与官网，默认 dev 端口 5567
│   ├── vscode-web       # Vite 版 WebView 应用，默认 dev 端口 3000
│   └── vscode           # VS Code 扩展入口，打开远程 WebView
├── packages
│   ├── core             # 核心业务：类型、状态、hooks、数据同步、练习组件
│   ├── base             # 基础 UI：按钮、表单、弹窗、Toast、音频、分页等
│   └── libs             # 翻译器、语言列表、query string 工具
├── docs                 # 多语言 README、贡献说明及本分析文档
├── scripts              # EdgeOne 部署脚本
├── package.json         # workspace 根脚本和依赖
└── pnpm-workspace.yaml  # workspace 配置
```

### 2.1 应用层

| 路径 | 作用 |
| --- | --- |
| `apps/nuxt/app/pages` | Nuxt 页面路由，按单词、文章、用户、设置等业务分组。 |
| `apps/nuxt/app/plugins` | 初始化、错误上报、客户端/服务端指令注册。 |
| `apps/nuxt/i18n/locales` | 官网/主应用多语言文案。 |
| `apps/vscode-web/src/pages` | VS Code WebView 中复用的练习页面。 |
| `apps/vscode-web/src/z-polyfill` | 为 Vite 环境模拟 Nuxt 组件和运行时 API。 |
| `apps/vscode/src/extension.ts` | VS Code 扩展激活入口，创建 WebViewPanel。 |

### 2.2 共享包

| 路径 | 作用 |
| --- | --- |
| `packages/core/src/apis` | 后端 API 包装，统一走 `utils/http.ts`。 |
| `packages/core/src/composables` | 初始化、持久化、云同步、练习缓存、rrweb 录制。 |
| `packages/core/src/hooks` | 文章拆句、词典选择、键盘事件、音频、翻译、主题、导出。 |
| `packages/core/src/stores` | Pinia stores：基础学习数据、设置、练习运行状态、用户、运行时状态。 |
| `packages/core/src/types` | 业务实体、枚举和默认对象工厂函数。 |
| `packages/core/src/utils` | 数据升级、缓存、HTTP、Supabase、URL、事件总线、题目生成等工具。 |
| `packages/core/src/components` | 单词/文章练习、词典列表、设置弹窗、统计、文章编辑等业务组件。 |
| `packages/base/src` | 通用基础组件与 Toast/Dialog/Form/select/icon 等。 |
| `packages/libs/src` | 翻译抽象类、百度翻译实现、语言映射与 qs 工具。 |

## 3. 运行与构建关系

根脚本主要委托到 workspace 包：

| 命令 | 实际作用 |
| --- | --- |
| `pnpm run dev` | 启动 `@typewords/nuxt`。 |
| `pnpm run dev-vscode-web` | 启动 `@typewords/vscode-web`。 |
| `pnpm run build` / `generate` | Nuxt 静态生成，并复制构建产物。 |
| `pnpm run build-vscode-web` | Vite 构建后执行部署脚本。 |
| `pnpm -F @typewords/vscode-web build2` | 只做本地 Vite 构建，不触发部署。 |
| `pnpm -F typewords compile` | 编译 VS Code 扩展。 |

根 `test` 脚本为空，多个 workspace 包的 `test` 也未配置实际测试。

## 4. 核心架构主线

### 4.1 数据模型

核心实体位于 `packages/core/src/types`：

- `Word`：单词、音标、释义、例句、短语、近义词、词根和词源。
- `Article`：文章标题、正文、翻译、句子切分、音频、题目、新词。
- `Dict`：词典/书籍元数据，同时容纳 `words` 或 `articles`。
- `Statistics`：学习统计，支持跨天 session 切片。
- `PracticeData`：单词练习时的题目、错词、评级和输入进度。
- `TaskWords`：一次练习中的新词与复习词。
- `SaveData` / `BackupData` / `Snapshot`：本地保存、导出和版本快照结构。

### 4.2 状态分层

| Store | 责任 |
| --- | --- |
| `useBaseStore` | 词典、文章书籍、收藏、错词、已掌握词、FSRS 卡片、学习索引。 |
| `useSettingStore` | 声音、主题、快捷键、练习模式、FSRS 参数、显示偏好。 |
| `usePracticeStore` | 当前练习阶段、耗时、错题数、计时暂停和学习时间片段。 |
| `useRuntimeStore` | 弹窗、临时编辑词典、事件监听开关、全局 loading、错误状态。 |
| `useUserStore` | token、登录状态、用户信息加载和退出。 |

### 4.3 本地与远程同步

本地主要使用 `idb-keyval`。核心流程：

1. `useInit().init()` 读取本地词典和设置。
2. `checkAndUpgradeSaveDict`、`checkAndUpgradeSaveSetting` 对旧数据做容错升级。
3. `useDataSyncPersistence().syncData()` 根据版本号和 `updated_at` 比较本地/远程。
4. 远程较新则拉取，远程缺失或本地较新则推送。
5. Pinia `$subscribe` 监听后续变更，防抖保存到本地并同步 Supabase。

### 4.4 练习流程

单词练习的关键路径：

1. `useGetDict` 或页面加载词典数据。
2. `getCurrentStudyWord` 生成本次练习的新词/复习词。
3. `TypeWord.vue` 处理输入、播放、跳词、掌握/认识/不认识等交互。
4. `usePracticeWordPersistence` 保存或恢复练习缓存。
5. `flushStatToStore` 在练习结束或切换前落统计。

文章练习的关键路径：

1. `splitEnArticle2` / `splitCNArticle2` 将正文拆成句子。
2. `genArticleSectionData` 生成 `sections` 与 `ArticleWord` token。
3. `TypingArticle.vue` 跟踪段落、句子、词位置与输入状态。
4. `usePlaySentenceAudio` 按句子音频区间播放，或回退到单词发音。
5. `usePracticeArticlePersistence` 保存/恢复文章练习位置。

## 5. 核心函数级分析

以下函数级分析以 `packages/core` 为主，覆盖业务逻辑、状态、持久化、工具函数和 API 包装。Vue 组件中的模板事件匿名函数不展开，只列关键具名函数和组件职责。

### 5.1 API 层

| 文件 | 函数 | 功能 |
| --- | --- | --- |
| `apis/index.ts` | `remove` | 克隆请求对象并移除大字段 `words/articles/statistics`，避免上传冗余词典内容。 |
| `apis/index.ts` | `dictListVersion` | 获取后端词典列表版本号。 |
| `apis/index.ts` | `myDictList` | 获取当前用户已同步的词典列表。 |
| `apis/index.ts` | `add2MyDict` | 将词典加入用户词典，并返回用户词典 id。 |
| `apis/index.ts` | `addStat` | 上传学习统计。 |
| `apis/index.ts` | `detail` | 获取词典详情，包含统计和文章/单词数据。 |
| `apis/index.ts` | `setUserDictProp` | 更新用户词典属性，如学习数量、索引、完成状态。 |
| `apis/index.ts` | `syncSetting` | 将本地设置同步到服务端。 |
| `apis/index.ts` | `getSetting` | 从服务端获取设置。 |
| `apis/index.ts` | `addDict` | 新增词典。 |
| `apis/index.ts` | `uploadImportData` | 上传导入数据，支持进度回调和长超时。 |
| `apis/index.ts` | `upload` | 上传普通文件。 |
| `apis/index.ts` | `getProgress` | 获取词典导入/处理进度。 |
| `apis/user.ts` | `loginApi` | 用户登录，返回 token。 |
| `apis/user.ts` | `registerApi` | 用户注册，返回 token。 |
| `apis/user.ts` | `sendCode` | 发送验证码。 |
| `apis/user.ts` | `resetPasswordApi` | 重置密码。 |
| `apis/user.ts` | `wechatLogin` | 微信授权登录。 |
| `apis/user.ts` | `refreshToken` | 刷新 token。 |
| `apis/user.ts` | `getUserInfo` | 获取当前用户资料。 |
| `apis/user.ts` | `setPassword` | 设置账户密码。 |
| `apis/user.ts` | `changeEmailApi` | 修改邮箱。 |
| `apis/user.ts` | `changePhoneApi` | 修改手机号。 |
| `apis/user.ts` | `updateUserInfoApi` | 更新用户基础资料。 |
| `apis/member.ts` | `levelBenefits` | 查询会员等级和权益。 |
| `apis/member.ts` | `orderCreate` | 创建会员订单。 |
| `apis/member.ts` | `alipayQuery` | 查询支付宝支付结果。 |
| `apis/member.ts` | `testPay` | 调用测试支付接口。 |
| `apis/member.ts` | `orderStatus` | 查询订单状态。 |
| `apis/member.ts` | `couponInfo` | 查询优惠券信息。 |
| `apis/member.ts` | `setAutoRenewApi` | 设置会员自动续费状态。 |
| `apis/dict.ts` | `copyOfficialDict` | 复制官方词典到用户词典。 |
| `apis/dict.ts` | `deleteDict` | 删除词典。 |
| `apis/words.ts` | `wordDelete` | 删除单词。 |

### 5.2 类型与默认值

| 文件 | 函数 | 功能 |
| --- | --- | --- |
| `types/func.ts` | `getDefaultWord` | 生成完整 `Word` 默认对象，并合并传入字段。 |
| `types/func.ts` | `getDefaultArticleWord` | 生成文章练习 token，继承 `Word` 并补充 `nextSpace/input/type`。 |
| `types/func.ts` | `getDefaultArticle` | 生成完整 `Article` 默认对象。 |
| `types/func.ts` | `getDefaultDict` | 生成完整 `Dict` 默认对象，并把 `words/articles/statistics` 包装为浅响应数组。 |
| `config/auth.ts` | `getWechatAuthUrl` | 按微信 OAuth 参数生成授权跳转 URL。 |

### 5.3 Store 函数

| Store | 函数/Getter | 功能 |
| --- | --- | --- |
| `base.ts` | `getDefaultBaseState` | 构造基础学习状态，包含内置收藏/错词/已掌握词典。 |
| `base.ts` | `collectWord` | 返回单词收藏词典。 |
| `base.ts` | `collectArticle` | 返回文章收藏书籍。 |
| `base.ts` | `wrong` | 返回错词词典。 |
| `base.ts` | `known` | 返回已掌握词典。 |
| `base.ts` | `knownWords` | 以小写字符串数组返回已掌握单词。 |
| `base.ts` | `allIgnoreWords` | 合并已掌握词和简单词，作为忽略列表。 |
| `base.ts` | `knownWordsSet` | 以 Set 形式返回已掌握单词。 |
| `base.ts` | `allIgnoreWordsSet` | 以 Set 形式返回忽略列表。 |
| `base.ts` | `sdict` | 返回当前学习词典。 |
| `base.ts` | `groupLength` | 根据词典长度和每日学习数计算分组总数。 |
| `base.ts` | `currentGroup` | 根据 `lastLearnIndex` 计算当前学习组。 |
| `base.ts` | `currentStudyProgress` | 计算当前词典学习进度百分比。 |
| `base.ts` | `getDictCompleteDate` | 估算词典还需学习天数。 |
| `base.ts` | `sbook` | 返回当前学习书籍。 |
| `base.ts` | `currentBookProgress` | 计算当前文章书籍进度。 |
| `base.ts` | `setState` | 重置并恢复基础状态，重建浅响应数组。 |
| `base.ts` | `init` | 从 IndexedDB 读取词典数据，升级后合并服务端数据。 |
| `base.ts` | `changeDict` | 切换当前词典，必要时同步到后端，并清理其他非自定义词典的大数组。 |
| `base.ts` | `changeBook` | 切换当前文章书籍，逻辑与词典切换类似。 |
| `setting.ts` | `getDefaultSettingState` | 构造完整设置默认值。 |
| `setting.ts` | `setState` | patch 设置状态。 |
| `setting.ts` | `init` | 从 IndexedDB 读取设置，升级后合并服务端设置。 |
| `practice.ts` | `getStageName` | 返回当前练习阶段中文名。 |
| `practice.ts` | `nextStage` | 根据练习模式返回下一个阶段。 |
| `practice.ts` | `pauseTimer` | 暂停计时并定格当前时间片段结束时间。 |
| `practice.ts` | `resumeTimer` | 恢复计时并开启新的时间片段。 |
| `runtime.ts` | `updateExcludeRoutes` | 增删不需要 keep-alive 或需排除的路由。 |
| `user.ts` | `setToken` | 写入 token，更新 `AppEnv` 和 localStorage。 |
| `user.ts` | `clearToken` | 清空 token、登录态和用户信息。 |
| `user.ts` | `setUser` | 写入用户资料并标记登录。 |
| `user.ts` | `logout` | 清 token 并提示退出登录。 |
| `user.ts` | `fetchUserInfo` | 请求用户资料，成功后写入 store。 |
| `user.ts` | `init` | 初始化用户状态，失败则清除 token。 |

### 5.4 Hooks

| 文件 | 函数 | 功能 |
| --- | --- | --- |
| `hooks/article.ts` | `parseSentence` | 将英文句子拆成练习 token，识别货币、数字、缩写、单词、符号，并记录是否跟随空格。 |
| `hooks/article.ts` | `genArticleSectionData` | 将文章正文和翻译生成 `sections`，补齐句子翻译和音频区间，并回写规范化正文。 |
| `hooks/article.ts` | `splitEnArticle2` | 按英文标点拆句，处理缩写、小数、引号和段落。 |
| `hooks/article.ts` | `splitCNArticle2` | 使用 `Intl.Segmenter` 按中文句子拆分文本。 |
| `hooks/article.ts` | `usePlaySentenceAudio` | 返回 `playSentenceAudio`，优先播放句子音频片段，否则播放整句单词发音。 |
| `hooks/article.ts` | `syncBookInMyStudyList` | 将运行时编辑书籍同步回我的学习列表，可设置为当前学习书籍。 |
| `hooks/dict.ts` | `useWordOptions` | 返回单词收藏、已掌握、错词删除等操作函数。 |
| `hooks/dict.ts` | `isWordCollect` | 判断单词是否已收藏。 |
| `hooks/dict.ts` | `toggleWordCollect` | 切换单词收藏状态。 |
| `hooks/dict.ts` | `isWordSimple` | 判断单词是否在已掌握列表。 |
| `hooks/dict.ts` | `toggleWordSimple` | 切换单词已掌握状态。 |
| `hooks/dict.ts` | `delWrongWord` | 从错词词典删除单词。 |
| `hooks/dict.ts` | `delSimpleWord` | 从已掌握词典删除单词。 |
| `hooks/dict.ts` | `useArticleOptions` | 返回文章收藏相关操作。 |
| `hooks/dict.ts` | `isArticleCollect` | 判断文章是否已收藏。 |
| `hooks/dict.ts` | `toggleArticleCollect` | 切换文章收藏状态。 |
| `hooks/dict.ts` | `getCurrentStudyWord` | 根据当前词典、每日数量、忽略词和 FSRS 到期时间生成新词/复习词。 |
| `hooks/dict.ts` | `useGetDict` | 在文章书籍编辑/学习页加载书籍，必要时从资源 URL 或后端详情补数据。 |
| `hooks/event.ts` | `useWindowClick` | 挂载窗口点击事件，同时监听全局关闭事件。 |
| `hooks/event.ts` | `useEventListener` | 统一挂载/清理事件监听；移动端为键盘输入创建隐藏 input 并合成 keydown。 |
| `hooks/event.ts` | `getShortcutKey` | 将键盘事件转换为配置可比较的快捷键字符串。 |
| `hooks/event.ts` | `useStartKeyboardEventListener` | 启动全局键盘分发：快捷键触发事件，普通输入转发到 `onTyping`。 |
| `hooks/event.ts` | `useOnKeyboardEventListener` | 注册业务层 keydown/keyup 回调，组件卸载时清理。 |
| `hooks/event.ts` | `useDisableEventListener` | 通过 watch 控制运行时键盘监听开关。 |
| `hooks/export.ts` | `useExport` | 组合导出相关能力。 |
| `hooks/export.ts` | `getExportedData` | 汇总设置、词典、单词练习缓存、文章练习缓存为备份对象。 |
| `hooks/export.ts` | `exportData` | 动态加载 JSZip，打包数据和本地音频文件并下载。 |
| `hooks/fsrs.ts` | `useGetGradeByWrongTimes` | 根据错误次数映射到 FSRS `Easy/Good/Hard/Again`。 |
| `hooks/fsrs.ts` | `useNextCard` | 根据 FSRS 参数计算下一张记忆卡状态。 |
| `hooks/sound.ts` | `getBrowserKey` | 解析 userAgent，返回 `os+browser` 组合键。 |
| `hooks/sound.ts` | `useSound` | 创建可复用音频池，返回 `play` 和 `setAudio`。 |
| `hooks/sound.ts` | `usePlayKeyboardAudio` | 根据设置播放键盘音效。 |
| `hooks/sound.ts` | `usePlayBeep` | 播放提示音。 |
| `hooks/sound.ts` | `usePlayCorrect` | 播放正确反馈音。 |
| `hooks/sound.ts` | `usePlayWordAudio` | 调用有道发音接口播放单词，失败时回退到浏览器 TTS。 |
| `hooks/sound.ts` | `getVoicesAsync` | 异步获取浏览器 TTS 声音列表。 |
| `hooks/sound.ts` | `useTTsPlayAudio` | 使用 SpeechSynthesis 播放文本，并优先使用用户保存的声音。 |
| `hooks/sound.ts` | `usePlayAudio` | 直接播放指定 URL 音频。 |
| `hooks/sound.ts` | `getAudioFileUrl` | 根据键盘音效名称返回资源路径列表。 |
| `hooks/theme.ts` | `getSystemTheme` | 读取系统深浅色偏好。 |
| `hooks/theme.ts` | `swapTheme` | 在 `light/dark` 间切换。 |
| `hooks/theme.ts` | `listenToSystemThemeChange` | 监听系统主题变化并回调。 |
| `hooks/theme.ts` | `setTheme` | 将主题 class 写到 `document.documentElement`。 |
| `hooks/theme.ts` | `useTheme` | 返回主题切换、设置、读取函数。 |
| `hooks/translate.ts` | `getSentenceAllTranslateText` | 从文章 sections 汇总翻译文本。 |
| `hooks/translate.ts` | `getSentenceAllText` | 从文章 sections 汇总原文文本。 |
| `hooks/translate.ts` | `getNetworkTranslate` | 使用翻译引擎批量翻译标题与句子，支持进度和重试。 |

### 5.5 Composables

| 文件 | 函数 | 功能 |
| --- | --- | --- |
| `useInit.ts` | `useInit` | 返回应用初始化函数，负责读取本地数据、同步远端、设置订阅和页面可见性恢复同步。 |
| `useInit.ts` | `init` | 初始化实际执行体，防止重复执行并注册 store 保存监听。 |
| `useDataSyncPersistence.ts` | `getDataVersion` | 根据同步类型返回当前数据版本号。 |
| `useDataSyncPersistence.ts` | `getPersistKey` | 返回词典/设置在 IndexedDB 中的 key。 |
| `useDataSyncPersistence.ts` | `getSyncClient` | 获取可用 Supabase client。 |
| `useDataSyncPersistence.ts` | `getLocalPersistMeta` | 读取本地数据版本和更新时间元信息。 |
| `useDataSyncPersistence.ts` | `persistLocalState` | 按同步类型保存本地数据。 |
| `useDataSyncPersistence.ts` | `applyDictData` | 将远程词典状态应用到 store，并按需重新加载公共资源词典内容。 |
| `useDataSyncPersistence.ts` | `fetchServerMeta` | 从 Supabase 读取指定类型的版本和更新时间。 |
| `useDataSyncPersistence.ts` | `fetchServerDatas` | 从 Supabase 读取完整同步数据。 |
| `useDataSyncPersistence.ts` | `compareResultByType` | 按类型比较本地与远程的新旧状态。 |
| `useDataSyncPersistence.ts` | `upsertServerDatas` | 批量 upsert 远程同步数据。 |
| `useDataSyncPersistence.ts` | `applyRemoteDataByType` | 按类型升级并应用远程数据到本地。 |
| `useDataSyncPersistence.ts` | `getDictSyncBlockReason` | 检测自定义文章本地音频是否阻塞云同步。 |
| `useDataSyncPersistence.ts` | `normalizeHash` | 校验并清洗版本 hash 字符串。 |
| `useDataSyncPersistence.ts` | `ensureHashGuardBeforeInit` | 初始化前检查站点 hash 变化，必要时创建本地快照。 |
| `useDataSyncPersistence.ts` | `saveHashSnapshot` | 保存词典、设置、练习缓存快照，并维护最多 15 条索引。 |
| `useDataSyncPersistence.ts` | `useDataSyncPersistence` | 返回同步、保存、强制推送、拉取、清空等数据持久化接口。 |
| `useDataSyncPersistence.ts` | `pullIfRemoteNewer` | 指定类型远程更新时拉取并应用。 |
| `useDataSyncPersistence.ts` | `syncData` | 对多类数据做拉取/推送同步。 |
| `useDataSyncPersistence.ts` | `saveLocalAndSync` | 先保存本地，再根据远程状态决定拉取或推送。 |
| `useDataSyncPersistence.ts` | `forcePushLocalDataToRemote` | 将备份数据强制写入远程和本地。 |
| `useDataSyncPersistence.ts` | `pullAllRemoteToLocal` | 拉取所有远程数据并覆盖本地。 |
| `useDataSyncPersistence.ts` | `prepareDictState` | 生成适合同步的词典状态，并处理本地音频阻塞情况。 |
| `useDataSyncPersistence.ts` | `saveDictState` | 保存词典状态并同步。 |
| `useDataSyncPersistence.ts` | `getLocalCompactDataByType` | 返回指定类型的本地紧凑数据。 |
| `useDataSyncPersistence.ts` | `clear` | 清空本地核心状态并推送空状态。 |
| `usePracticePersistence.ts` | `flushStatToStore` | 将练习统计写入当前词典，跨天时拆成多条统计。 |
| `usePracticePersistence.ts` | `isCompactPracticeWordCache` | 判断单词练习缓存是否为紧凑格式。 |
| `usePracticePersistence.ts` | `createWordMap` | 为当前词典构建 word 到 `Word` 的索引。 |
| `usePracticePersistence.ts` | `restoreWords` | 根据单词字符串列表恢复 `Word[]`。 |
| `usePracticePersistence.ts` | `serializePracticeWordCache` | 将练习缓存压缩为字符串引用，减少同步体积。 |
| `usePracticePersistence.ts` | `restorePracticeWordCache` | 将紧凑缓存恢复为完整练习数据。 |
| `usePracticePersistence.ts` | `usePracticeWordPersistence` | 返回单词练习缓存 load/save/clear/fetch 接口。 |
| `usePracticePersistence.ts` | `usePracticeArticlePersistence` | 返回文章练习缓存 load/save/clear/fetch 接口。 |
| `useRrweb.ts` | `sessionKey` | 生成 rrweb 会话 IndexedDB key。 |
| `useRrweb.ts` | `getSessionIndex` | 读取 rrweb 会话索引。 |
| `useRrweb.ts` | `updateSessionIndex` | 更新索引并按上限删除旧会话。 |
| `useRrweb.ts` | `persistSession` | 保存会话 events 和元数据。 |
| `useRrweb.ts` | `startRrwebRecording` | 启动 rrweb 录制，控制采样、保存频率和自动停止。 |
| `useRrweb.ts` | `stopCurrentSession` | 停止当前 rrweb 录制。 |
| `useRrweb.ts` | `exportRrwebSessions` | 导出全部录制会话为 JSON。 |
| `useRrweb.ts` | `getRrwebSessionStats` | 返回会话数量、事件总数和最新开始时间。 |
| `useRrweb.ts` | `deleteRrwebSession` | 删除指定录制会话。 |
| `useRrweb.ts` | `getAllRrwebSessions` | 读取所有录制会话并按时间倒序返回。 |

### 5.6 工具函数

| 文件 | 函数 | 功能 |
| --- | --- | --- |
| `utils/index.ts` | `no` | 显示“未实现”提示。 |
| `utils/index.ts` | `checkRiskKey` | 从目标对象拷贝默认对象已有字段，避免旧数据缺字段。 |
| `utils/index.ts` | `checkAndUpgradeSaveDict` | 解析并升级词典保存数据，异常时创建快照并回退默认状态。 |
| `utils/index.ts` | `parseJsonStr` | 解析 `SaveData` JSON，并用回调升级 `val`。 |
| `utils/index.ts` | `checkAndUpgradeSaveSetting` | 解析并升级设置数据，处理历史版本迁移和事故快照回填。 |
| `utils/index.ts` | `shakeCommonDict` | 移除公共词典/书籍的大数组，减少保存体积。 |
| `utils/index.ts` | `isMobile` | 通过 UA 判断移动端。 |
| `utils/index.ts` | `useNav` | 封装路由跳转，并可携带临时 `routeData`。 |
| `utils/index.ts` | `_dateFormat` | 将时间戳格式化。 |
| `utils/index.ts` | `msToHourMinute` | 毫秒转小时分钟展示文本。 |
| `utils/index.ts` | `msToMinute` | 毫秒转分钟展示文本。 |
| `utils/index.ts` | `_getAccomplishDays` | 计算剩余任务所需天数。 |
| `utils/index.ts` | `_getAccomplishDate` | 计算预计完成日期。 |
| `utils/index.ts` | `_getStudyProgress` | 计算学习进度百分比。 |
| `utils/index.ts` | `_nextTick` | 在 Vue `nextTick` 后执行回调，可附加延时。 |
| `utils/index.ts` | `_parseLRC` | 解析 LRC 歌词/字幕时间轴。 |
| `utils/index.ts` | `sleep` | Promise 形式延时。 |
| `utils/index.ts` | `_getDictDataByUrl` | 从资源 URL 拉取词典或文章数据并包装为 `Dict`。 |
| `utils/index.ts` | `convertToWord` | 将导入的扁平字段转换为标准 `Word`。 |
| `utils/index.ts` | `cloneDeep` | 使用 JSON 序列化做深拷贝。 |
| `utils/index.ts` | `shuffle` | 返回洗牌后的数组副本。 |
| `utils/index.ts` | `last` | 返回数组最后一项。 |
| `utils/index.ts` | `debounce` | 防抖包装函数。 |
| `utils/index.ts` | `throttle` | 节流包装函数。 |
| `utils/index.ts` | `reverse` | 返回反转后的数组副本。 |
| `utils/index.ts` | `groupBy` | 按指定 key 分组数组。 |
| `utils/index.ts` | `getRandomN` | 随机取 N 个元素。 |
| `utils/index.ts` | `splitIntoN` | 将数组尽量均匀分成 N 份。 |
| `utils/index.ts` | `loadJsLib` | 动态加载普通 JS 或 mjs 库，并挂到 `window`。 |
| `utils/index.ts` | `total` | 对数组对象指定字段求和。 |
| `utils/index.ts` | `resourceWrap` | 根据官方/本地环境生成资源 URL，并附加词典版本。 |
| `utils/index.ts` | `isNewUser` | 通过比较当前状态和默认状态判断是否新用户。 |
| `utils/index.ts` | `jump2Feedback` | 打开反馈问卷。 |
| `utils/index.ts` | `isIOS` | 判断是否 iOS。 |
| `utils/index.ts` | `parseTimestamp` | 解析 ISO 时间字符串。 |
| `utils/index.ts` | `compareTimestamps` | 比较本地/远程更新时间。 |
| `utils/index.ts` | `shouldFetchRemote` | 先按版本、再按时间判断远程/本地谁更新。 |
| `utils/index.ts` | `isEmpty` | 判断对象、数组或空值是否为空。 |
| `utils/index.ts` | `normalizeWord` | 将中文标点、智能引号等归一化为英文输入字符。 |
| `utils/base-url.ts` | `getRootedBaseURL` | 将 baseURL 归一为根路径，忽略无效输入。 |
| `utils/base-url.ts` | `getBaseURLFromAssetPath` | 从 manifest 或 `_nuxt` 静态资源路径推断 baseURL。 |
| `utils/base-url.ts` | `getDocumentBaseURL` | 从 DOM 中探测当前应用 baseURL。 |
| `utils/base-url.ts` | `normalizeBaseURL` | 标准化 baseURL 为 `/xxx/` 格式。 |
| `utils/base-url.ts` | `getAppBaseURL` | 综合 Nuxt runtime、DOM、env 和 Vite BASE_URL 得到应用 baseURL。 |
| `utils/base-url.ts` | `withAppBaseURL` | 给站内绝对路径补应用 baseURL。 |
| `utils/base-url.ts` | `toSiteURL` | 组合 origin/baseURL/path 生成完整站点 URL。 |
| `utils/cache.ts` | `migrateFromLocalStorage` | 将旧 localStorage 练习缓存迁移到 IndexedDB。 |
| `utils/cache.ts` | `getLocalWithMeta` | 读取带版本和更新时间的本地缓存。 |
| `utils/cache.ts` | `getLocal` | 读取缓存 `val`，空对象视为无数据。 |
| `utils/cache.ts` | `setLocal` | 写入带元信息的本地缓存。 |
| `utils/cache.ts` | `getPracticeWordCacheLocal` | 读取单词练习缓存。 |
| `utils/cache.ts` | `getPracticeWordCacheLocalWithMeta` | 读取单词练习缓存及元信息。 |
| `utils/cache.ts` | `setPracticeWordCacheLocal` | 写入单词练习缓存。 |
| `utils/cache.ts` | `getPracticeArticleCacheLocal` | 读取文章练习缓存。 |
| `utils/cache.ts` | `getPracticeArticleCacheLocalWithMeta` | 读取文章练习缓存及元信息。 |
| `utils/cache.ts` | `setPracticeArticleCacheLocal` | 写入文章练习缓存。 |
| `utils/eventBus.ts` | `useEvents` | 组件挂载时注册 mitt 事件，卸载时清理。 |
| `utils/eventBus.ts` | `useEventsByWatch` | 根据 watch 条件动态注册/注销事件。 |
| `utils/http.ts` | `request` | 基于 axios 发请求，统一返回 `AxiosResponse<T>`。 |
| `utils/supabase.ts` | `getConfig` | 从 localStorage 读取 Supabase 配置。 |
| `utils/supabase.ts` | `setConfig` | 合并并保存 Supabase 配置。 |
| `utils/supabase.ts` | `Supabase.check` | 判断配置是否允许同步。 |
| `utils/supabase.ts` | `Supabase.saveConfig` | 保存 Supabase url/key。 |
| `utils/supabase.ts` | `Supabase.removeConfig` | 删除 Supabase 配置。 |
| `utils/supabase.ts` | `Supabase.getInstance` | 创建或返回 Supabase client，异常时返回空实现。 |
| `utils/supabase.ts` | `Supabase.getConfig` | 静态代理读取配置。 |
| `utils/supabase.ts` | `Supabase.getStatus` | 读取同步状态。 |
| `utils/supabase.ts` | `Supabase.setStatus` | 写同步状态，并同步运行时错误标记。 |
| `utils/validation.ts` | `validateEmail` | 邮箱格式校验。 |
| `utils/validation.ts` | `validatePhone` | 中国大陆手机号校验。 |
| `utils/MessageBox.tsx` | `MessageBox.confirm` | 动态渲染确认弹窗。 |
| `utils/MessageBox.tsx` | `MessageBox.notice` | 动态渲染通知弹窗。 |
| `utils/gm.js` | `$notice` | 原生 DOM 创建全局短提示。 |
| `utils/gm.js` | `$stopPropagation` | 阻止事件传播和默认行为。 |
| `utils/gm.js` | `$getCss` | 读取计算样式并转为数值。 |
| `utils/gm.js` | `$setCss` | 设置样式，特殊兼容 transform 前缀。 |
| `utils/gm.js` | `copy` | 使用临时 input 复制文本。 |
| `utils/word-test.ts` | `getTrans` | 合并单词释义并累计词频。 |
| `utils/word-test.ts` | `calCommon` | 计算两个字符串字符重合度。 |
| `utils/word-test.ts` | `calSimilarity` | 综合释义、拼写、派生词计算两个单词的相似度。 |
| `utils/word-test.ts` | `buildQuestion` | 为单词测试构造选项，选择相似干扰项并随机排序。 |

### 5.7 翻译库

| 文件 | 函数/方法 | 功能 |
| --- | --- | --- |
| `packages/libs/src/translate/translator/translator.ts` | `Translator.translate` | 调用子类 `query`，并把翻译结果补充 `engine` 字段。 |
| `packages/libs/src/translate/translator/translator.ts` | `Translator.request` | 使用 axios 发底层请求。 |
| `packages/libs/src/translate/translator/translator.ts` | `Translator.detect` | 语言检测占位，默认未实现。 |
| `packages/libs/src/translate/translator/translator.ts` | `Translator.textToSpeech` | 文本转语音占位，默认返回 `null`。 |
| `packages/libs/src/translate/baidu.ts` | `Baidu.query` | 生成百度翻译签名，请求翻译接口，并转换为统一结果。 |
| `packages/libs/src/translate/baidu.ts` | `Baidu.getSupportLanguages` | 返回百度翻译支持的语言列表。 |
| `packages/libs/src/translate/baidu.ts` | `Baidu.textToSpeech` | 生成百度 TTS URL。 |
| `packages/libs/src/qs.ts` | `stringify` | 将对象编码成 query string。 |

## 6. 关键业务组件职责

| 组件 | 关键函数 | 职责 |
| --- | --- | --- |
| `components/word/TypeWord.vue` | `playTtsWithGuide`、`updateCurrentWordInfo`、`reset`、`repeat`、`know`、`mastered`、`unknown`、`select`、`onTyping`、`shouldRepeat`、`completeTypeWord`、`del`、`showWord`、`hideWord`、`typo`、`play`、`checkCursorPosition` | 单词练习核心组件，处理发音、输入、重复次数、认识/掌握/不会、自测选择、自动切词和错误反馈。 |
| `components/article/TypingArticle.vue` | `savePracticeData`、`init`、`checkCursorPosition`、`checkTranslateLocation`、`processMobileCharacter`、`handleMobileInput`、`nextSentence`、`onTyping`、`play`、`del`、`showSentence`、`hideSentence`、`jump`、`applyPracticeCache`、`onContextMenu`、`isCurrent` | 文章跟打核心组件，维护段落/句子/词索引、移动端输入、音频播放、缓存恢复、跳转和上下文菜单。 |
| `components/article/EditArticle.vue` | `apply`、`splitText`、`splitTranslateText`、`startNetworkTranslate`、`saveSentenceTranslate`、`saveSentenceText`、`save`、`handleAudioChange`、`addName`、`removeName`、`recordStart`、`recordEnd`、`saveLrcPosition`、`jumpAudio`、`setStartTime`、`setEndTime` | 文章编辑器，负责拆句、翻译、保存、音频上传、LRC 时间轴编辑和人名列表。 |
| `components/BaseTable.vue` | `scrollToBottom`、`scrollToTop`、`scrollToItem`、`toggleSelect`、`toggleSelectAll`、`sort`、`handleBatchDel`、`search`、`cancelSearch`、`getData`、`handlePageNo`、`downloadJsonTemplate` | 通用表格，支持分页、排序、选择、搜索、批量删除和模板下载。 |
| `components/list/*` | `scrollToBottom`、`scrollToItem`、`scrollViewToCenter`、`itemIsActive`、`dragstart`、`dragover`、`dragend`、`delItem` | 词典/文章/单词列表展示和拖拽排序。 |
| `components/article/QuestionItem.vue` | `initOptions`、`getLetter`、`getOriginalLetter`、`onSelect`、`emitAnswer`、`submit`、`feedbackClass`、`calculateLayout` | 文章题目选项渲染、作答、提交和反馈样式。 |
| `components/article/QuestionForm.vue` | `startExam`、`onAnswered`、`submitAll` | 文章题目考试流程控制。 |
| `components/word/Statistics.vue` | `calcWeekList`、`options` | 统计最近学习数据并生成图表配置。 |
| `components/word/WordMarkPickList.vue` | `onWordClick`、`rowClass`、`buildUnknownList`、`buildThreeLists`、`onComplete` | 用于标记认识/不认识/已掌握词列表。 |
| `components/slide/common.js` | `slideInit`、`slideTouchStart`、`canSlide`、`slideTouchMove`、`slideTouchEnd`、`slideReset`、`getSlideDistance` | 触摸滑动通用逻辑。 |
| `components/channel-icons/ShareIcon.vue` | `copyImageToClipboard`、`downloadImage`、`changeBackground` | 分享图复制、下载和背景切换。 |
| `components/user/Code.vue` | `sendVerificationCode` | 发送验证码并处理倒计时。 |
| `components/dialog/MigrateDialog.vue` | `migrateFromOldSite`、`transfer` | 从旧站迁移用户数据。 |
| `components/dialog/BackupGateDialog.vue` | `onBackup` | 触发备份导出或备份入口逻辑。 |

## 7. 应用入口函数

| 文件 | 函数/方法 | 功能 |
| --- | --- | --- |
| `apps/vscode/src/extension.ts` | `ChatPanel.createOrShow` | 有面板则展示，无面板则创建 WebViewPanel。 |
| `apps/vscode/src/extension.ts` | `ChatPanel.dispose` | 清理面板和 disposable。 |
| `apps/vscode/src/extension.ts` | `ChatPanel._update` | 生成并写入 WebView HTML。 |
| `apps/vscode/src/extension.ts` | `ChatPanel._getHtmlForWebview` | 从 CDN 配置读取 JS/CSS，并生成带 CSP 的 HTML。 |
| `apps/vscode/src/extension.ts` | `activate` | 注册 `typewords.openChat` 命令。 |
| `apps/vscode/src/extension.ts` | `deactivate` | 扩展停用钩子，目前为空。 |
| `apps/vscode-web/src/main.ts` | 顶层初始化 | 创建 Vue 应用，注册 Pinia、路由、虚拟列表、Nuxt polyfill、指令并挂载。 |
| `apps/nuxt/nuxt.config.ts` | `normalizeBaseURL` | 标准化 Nuxt 应用 baseURL。 |
| `apps/nuxt/nuxt.config.ts` | `withBaseURL` | 给路径补 baseURL。 |
| `apps/nuxt/nuxt.config.ts` | `toSiteURL` | 生成 SEO 使用的完整 URL。 |

## 8. 设计特点与风险点

### 8.1 设计特点

- `packages/core` 承担绝大多数业务能力，Nuxt 与 VS Code WebView 通过共享组件和 store 复用逻辑。
- 本地优先，远程同步可选；同步比较统一走 `shouldFetchRemote`，避免简单覆盖。
- 公共词典大数组在保存时通过 `shakeCommonDict` 删除，降低 IndexedDB 和云同步体积。
- 单词复习结合 FSRS 到期卡片与传统学习索引，能兼容新学和复习。
- 文章练习把原文拆为 `sections -> sentences -> words`，便于逐词跟打和音频区间播放。

### 8.2 需要关注的风险

| 风险 | 说明 |
| --- | --- |
| 测试覆盖不足 | 根 `test` 为空，核心拆句、同步、数据升级、练习缓存都缺少自动化回归。 |
| 数据升级逻辑复杂 | `checkAndUpgradeSaveSetting` 包含历史事故修复和快照回填，后续改版本号时需要谨慎。 |
| 同步依赖时间戳 | 本地/远程冲突主要依赖版本号和 `updated_at`，多端并发编辑仍可能出现覆盖。 |
| `cloneDeep` 局限 | JSON 深拷贝会丢失 Date、Map、函数和 undefined，当前业务多为普通对象但需注意扩展。 |
| 移动端键盘兼容复杂 | `useEventListener` 内部合成键盘事件，移动端输入法差异可能带来边界问题。 |
| 组件承担逻辑较重 | `TypeWord.vue`、`TypingArticle.vue`、`EditArticle.vue` 函数多且状态密集，后续维护成本较高。 |

## 9. 建议补充的验证用例

1. `splitEnArticle2`：缩写、小数、货币、引号嵌套、段落换行。
2. `parseSentence`：数字、百分比、连字符、撇号、省略号、符号和 `nextSpace`。
3. `checkAndUpgradeSaveDict` / `checkAndUpgradeSaveSetting`：缺版本、旧版本、字段缺失、损坏 JSON。
4. `shouldFetchRemote`：远程无版本、版本大/小/相等且时间不同。
5. `serializePracticeWordCache` / `restorePracticeWordCache`：紧凑缓存与旧缓存互转。
6. `getCurrentStudyWord`：忽略词、FSRS 到期词、完成词典、复习数量不足时的填充逻辑。
7. `useDataSyncPersistence.saveLocalAndSync`：远程新、本地新、无远程、禁用远程同步四种路径。

