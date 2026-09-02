# Univer CLI SDK 面向示例作者的能力与边界

- 调研日期：2026-09-02
- 窄问题：`univer-cli-sdk` 对应用层公开了哪些值得用示例展示的能力，各能力的关键限制是什么？
- 来源范围：[Univer Office `llms.txt`](https://office.univer.ai/llms.txt) 及其直接链接的官方文档；`dream-num/univer-cli-sdk` 一方源码。
- 源码基线：[`de3d8dc729d3d36d05cad3261a3c2830df51e5ec`](https://github.com/dream-num/univer-cli-sdk/tree/de3d8dc729d3d36d05cad3261a3c2830df51e5ec)（2026-09-01）。

## 结论

SDK 当前发布 25 个独立 package，可归并为 16 组面向示例作者的能力。其中 9 组同时提供基础 TypeScript API 和 Commander 命令预设；预设只处理参数、默认输出和退出行为，应用仍持有根 CLI、目标映射、身份授权、资源和长生命周期。官方包目录和根 README 定义了这个分层。[官方包目录](https://office.univer.ai/cli/packages.md) [SDK README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/README.md)

示例不必为每个 package 单独建项目。同一业务流可同时展示基础 API 与对应命令预设；纯底层基础设施应用聚焦使用条件、生命周期和失败处理，无需扩展成独立产品。

## 能力清单

| # | 能力与 package | 公开入口 / 示例应展示的主路径 | 关键限制和应用责任 | 一方来源 |
|---|---|---|---|---|
| 1 | 标准 headless Univer<br>`@univer-cli/headless-univer` | `createStandardHeadlessUniverFactory()` 创建已注册 Sheet、Doc、Slide、Base、Board、Facade、locale、formula 和 network 的 Node.js Univer；`createStandardHeadlessUniverFacade()` 返回同一依赖图上的 `FUniver`。 | 工厂不加载 UnitData/Snapshot，不捕获 mutation，不管 revision、OT、commit、pool、daemon、认证或传输。每次调用返回独占 Univer，所有者必须 dispose。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/headless-univer/README.md) |
| 2 | 离线 Facade API 发现<br>`@univer-cli/api-reference`<br>`@univer-cli/api-reference-command` | `createStandardApiReference().find()` 按 API 名/标识符片段找候选，`show()` 返回类、成员、类型或枚举的声明投影；`createApiCommand()` 提供 `api find/show`。示例应展示“先 find，再把 symbol 直接交给 show”。 | 离线索引不加载 Unit，也不解释意图。多个 term 独立查询，不是 AND；`limit` 作用于每个 term。可按 `sheet|slide|doc|base|board` 限制。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/api-reference/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/api-reference-command/README.md) |
| 3 | 面向 Unit 的 Facade 程序准备<br>`@univer-cli/content-execution` | `prepareContentExecutionProgram()` 将用户 JavaScript 绑定到明确 `unitId` 和 Unit 类型，注入 `univerAPI/api` 以及 `workbook|doc|presentation|base|board`。 | 只返回程序字符串；应用获取 runtime、选 read/write mode、管理 lease 并持久化更改。它不是安全沙箱，执行不可信代码时应用必须提供进程隔离。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/content-execution/README.md) [内容操作指南](https://office.univer.ai/cli/content-operations.md) |
| 4 | 结构化内容检查<br>`@univer-cli/content-inspection`<br>`@univer-cli/content-inspection-command` | `inspectContent()` 通过只读 runtime 返回 JSON-compatible 结果。Sheet 支持 workbook/worksheet/range；Doc 支持 document/paragraph；Slide 支持 presentation/slide；Base 提供表、字段、record count 和 view 摘要；Board 提供元素摘要和按 ID 详情。命令层提供普通与 Worktree 两种 `inspect` factory。 | Base 不返回 record values 和 view projections。Inspection 不覆盖条件格式完整规则、Chart 完整配置等长尾内容，这些用最小 `execute(read)` 补足。命令层逐请求获取并释放 lease；应用仍负责认证与内容加载。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/content-inspection/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/content-inspection-command/README.md) [内容操作指南](https://office.univer.ai/cli/content-operations.md) |
| 5 | 单 Unit 协同 runtime<br>`@univer-cli/univer-collaboration-runtime` | `factory.load()` 把一个 runtime 绑到一个 Unit；示例应贯通 `pull()` → `execute(read|write)` → `commit()` → `close()`，并展示 `getState()` / `exportUnitData()`。 | read mode 禁止 mutation；`fetch()` 不改内容；只有 `confirmed` 和 `nothing-to-commit` 表示 commit 完成。`pull-required` 要求再 pull/commit，`conflict` 要求停止写入并由应用选择恢复策略。runtime 不理解 Workspace、Worktree、URL、凭证或目标。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/univer-collaboration-runtime/README.md) [runtime 指南](https://office.univer.ai/cli/runtime-architecture.md) |
| 6 | Worker 中的协同 runtime pool<br>`@univer-cli/univer-collaboration-runtime-pool` | `defineUniverCollaborationRuntimeWorker()` 定义 worker entry，`createUniverCollaborationRuntimePool()` 按应用持有的 opaque key 独占 lease、缓存、TTL/LRU 回收 runtime。示例应展示成功 `release()`、不可信状态 `invalidate()` 和最终 `pool.close()`。 | worker entry 必须是已构建的 ESM JavaScript，init 必须可 structured-clone。同 key 的 lease FIFO 串行；不同 key 才可并行。pool 不验证 key 和 init 是否语义兼容，不定义 daemon 或远程加载。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/univer-collaboration-runtime-pool/README.md) [runtime 指南](https://office.univer.ai/cli/runtime-architecture.md) |
| 7 | SVG → Slide Facade JavaScript<br>`@univer-cli/svg-facade`<br>`@univer-cli/svg-facade-command` | capability 编译常见 shape、path、text、image、gradient、reference 和 viewport，返回 code、viewport、warning、authoring lint 和 text measurement；`createCompileSvgCommand()` 提供 `compile-svg`，支持写 stdout/file、指定 page、overlay 和 JSON 输出。 | 生成代码假定 `slide` 和 `univerAPI` 已在 scope。外部图片由调用方 resolver 提供，SDK 不读任意 URL/本地路径；文字保真度取决于注入的 measurer；不支持的 SVG 语义会生成诊断或错误。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/svg-facade/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/svg-facade-command/README.md) |
| 8 | Typst bundle → Doc Facade JavaScript<br>`@univer-cli/doc-typst-facade`<br>`@univer-cli/doc-typst-facade-command` | 编译包含 manifest 和有序 pages 的 Typst bundle，返回创建完整 Doc 的 JavaScript；可选 `previewDir` 使用官方 native binding 生成 PNG 预览。`createCompileTypstCommand()` 提供 `compile-typst`。 | 需要平台支持的 native binding。bundle 路径不得越出 root；拒绝绝对路径、URL、父级穿越和越界 symlink。生成代码假定 `univerAPI` 存在；manifest 的 target ID 不是 Workspace 真实内容身份。不传 `previewDir` 就不生成 PNG。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/doc-typst-facade/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/doc-typst-facade-command/README.md) |
| 9 | Unit 截图<br>`@univer-cli/unit-screenshot`<br>`@univer-cli/unit-screenshot-command` | `createUnitScreenshot().capture()` 支持 Sheet、Doc、Slide、Board、Base，处理 target、分页、scale、命名和资源限额；不给 target 时选对应 Unit 的默认内容。命令预设提供 `screenshot` 以及可选浏览器安装/探测命令。 | 输入是已物化的 UnitData，不加载远程 target/处理 changeset。capability 只返回 PNG bytes 和元数据，应用注入 writer；scale 为 0.1–4，应配置 page/pixel/total-pixel 限制。浏览器不会在每次截图时隐式下载。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/unit-screenshot/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/unit-screenshot-command/README.md) [可视化检查指南](https://office.univer.ai/cli/visual-inspection.md) |
| 10 | Slide 布局诊断<br>`@univer-cli/unit-layout-lint`<br>`@univer-cli/unit-layout-lint-command` | `createUnitLayoutLint().lint()` 用浏览器实际 layout facts 检测 `text-off-page`、`text-escapes-container`、`text-overlaps-text`；`createUnitLayoutLintCommand()` 提供 `lint`。示例应联合截图和 structured finding，不把 finding 自动当作内容错误。 | 当前只支持 Slide。不给 `pages` 时检查全部页；数字 selector 从 1 开始，字符串 selector 是 `slideOrder` 中的 page ID。应用物化 Slide、提供 render runtime，并保存/展示报告。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/unit-layout-lint/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/unit-layout-lint-command/README.md) [可视化检查指南](https://office.univer.ai/cli/visual-inspection.md) |
| 11 | Node 侧 Render Runtime<br>`@univer-cli/univer-render-runtime` | `createUniverRenderRuntime()` 托管静态 Render Page，启动 Chrome/Chromium/Edge，管理页面协议，为 screenshot/layout lint 提供 Sheet range、Doc page、Slide page、Board content 和 Base view/table 操作。一个 runtime 可串行复用多次，并在最外层 `close()`。 | 不内置 Univer plugin 或预构建页面，不加载远程内容，不选 screenshot target，不写 PNG。创建 runtime 不隐式下载浏览器。当前使用 Chromium `--no-sandbox`；不可信 UnitData 必须在受限用户、容器或其他进程隔离边界内渲染。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/univer-render-runtime/README.md) [可视化检查指南](https://office.univer.ai/cli/visual-inspection.md) |
| 12 | 浏览器侧 Render Page<br>`@univer-cli/univer-render-page` | `mountUniverRenderPage()` 挂载页面协议，`createPresetRenderUniver()` 提供就绪的 Univer/Pro 组合。示例应把页面构建为 root 包含 `index.html` 的静态目录，再传给 Render Runtime。 | 它不启动浏览器。自定义 `createUniver` 必须自己注册目标 Unit 需要的 content/render/UI/Facade plugin。预设包含 Pro plugin；无有效 license 仍可渲染，但输出遵循 Pro watermark 规则。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/univer-render-page/README.md) |
| 13 | 进程内 keyed instance pool<br>`@univer-cli/generic-keyed-instance-pool` | `createGenericKeyedInstancePool()` 对任意有状态对象做按 key 单租约、single-flight 创建、FIFO 等待、TTL/LRU 空闲回收和事件观测。示例应覆盖 acquire/release/invalidate/close 的区别。 | 只是进程内 raw instance 生命周期，不提供 worker、IPC、RPC、method proxy、业务操作或跨进程共享。key 只用于相等比较，兼容 init 映射由调用方保证。TTL/LRU 不中断 active lease。 | [package README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/generic-keyed-instance-pool/README.md) |
| 14 | 本地常驻 daemon<br>`@univer-cli/daemon`<br>`@univer-cli/daemon-command` | `createDaemonServer()` / `createDaemonClient()` 让多个短生命进程通过 Unix socket/Windows named pipe 调用同一常驻 Node 进程；`createDaemonControl()` 与 `createDaemonCommand()` 提供 status/start/restart/stop。与 runtime pool 组合时，daemon 才能跨 CLI invocation 保留 worker/runtime。 | payload/result 必须是 JSON value。应用必须在 `listen()` 前注册 handler；`daemon.status` / `daemon.shutdown` 为保留方法。timeout 只终止客户等待，不终止已验证 daemon。应用提供 socket path、entrypoint、identity、业务 method、凭证和 shutdown cleanup。直接进程已够用时无需 daemon。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/daemon/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/daemon-command/README.md) [runtime 指南](https://office.univer.ai/cli/runtime-architecture.md) |
| 15 | 应用配置<br>`@univer-cli/config`<br>`@univer-cli/config-command` | `defineConfig()` 由应用声明 key/default/codec，`createFileConfig()` 读写显式 JSON 值；内建 codec 覆盖非空字符串、boolean、integer、HTTP URL/origin。`createConfigCommand()` 提供 list/get/set/unset/path。示例应展示 `explicit|default|unset` 来源。 | 路径必须是应用选择的绝对 `.json` 路径；SDK 不选产品目录/文件名。文件只写 explicit values，default/description/codec 留在代码。值必须满足 `ConfigValue`，不可持久化函数、class instance 等任意对象。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/config/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/config-command/README.md) |
| 16 | 视觉资源库<br>`@univer-cli/resource-library`<br>`@univer-cli/resource-library-command` | `createResourceLibrary()` 用稳定 `<registryId>/<resourceId>` handle 提供 `listRegistries()`、`find()`、`read()`、`export()`；Node adapter 提供 filesystem cache/output、HTTPS downloader 和 manifest loader。`createResourcesCommand()` 提供 registries/find/read/export。 | SDK 验证 registry/resource ID、cache root 和 output path，downloader 只读 manifest 声明的内容。应用选可信 registry，提供认证 header 和网络策略。命令 JSON 摘要不混入 binary content。 | [capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/resource-library/README.md) [command README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/resource-library-command/README.md) |

## 不属于 CLI SDK 的组合边界

### Office 文件导入导出

Office 文件转换属于 Univer Pro Exchange，入口是 `@univerjs-pro/exchange-node` 的 `importFile()` / `exportToFile()`，CLI SDK 没有 import/export 命令预设。业务应用负责路径、格式政策、Unit 创建 API 和错误映射；导出协同 Unit 时应先通过 Collaboration Runtime 取最新完整 UnitData。[官方文件交换指南](https://office.univer.ai/cli/file-exchange.md) [SDK README 边界](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/README.md)

官方列出的格式为：Sheet 导入 `.xls/.xlsx/.xlsm/.csv/.tsv`、导出 `.xlsx/.csv/.tsv`；Doc 导入 `.doc/.docx`、导出 `.docx`；Slide 导入 `.ppt/.pptx/.pptm/.ppsx/.ppsm/.potx`、导出 `.pptx`。应用应在生成文件前校验 extension 与 Unit 类型。[支持格式](https://office.univer.ai/cli/file-exchange.md#supported-formats)

### Worktree 产品生命周期

Worktree Service、Endpoint、Client 和 Database Adapter 属于 Collaboration SDK。CLI SDK 仅把同一组 runtime、inspection、execution、screenshot 能力指向由应用选择的 trunk 或 draft target。`runtime.commit()` 只推进 draft；`markReady()` 冻结当前 draft revision 并进入审查；`mergeWorktree()` 才将各 Unit 合并到 trunk。应用定义 `worktreeID + unitID` 到协议 URL 的映射、身份、授权和生命周期命令。[官方 Worktree 指南](https://office.univer.ai/cli/worktree.md)

## 跨能力约束

1. **环境**：CLI SDK 需 Node.js 22.12+；Screenshot、Render 和 Layout Lint 需 Chrome、Chromium 或 Edge。已安装 package 的 `engines` 和 native dependency 要求是最终权威。[环境要求](https://office.univer.ai/requirements.md)
2. **版本队列一致**：一个应用内的 `@univerjs/*`、`@univerjs-pro/*` 和 `@univer-cli/*` 应使用同一版本队列。官站 requirements 页自述对应 `1.0.0-beta.2`，本报告源码基线则是 2026-09-01 的 insiders 队列；版本不同时，`llms.txt` 要求以已安装 package 的 types/source 为准。[环境与版本要求](https://office.univer.ai/requirements.md) [`llms.txt` 调研流程](https://office.univer.ai/llms.txt) [源码基线](https://github.com/dream-num/univer-cli-sdk/tree/de3d8dc729d3d36d05cad3261a3c2830df51e5ec)
3. **应用持有集成边界**：CLI SDK 是可组合 capability，不是固定产品 CLI。应用持有命令名、参数、target、identity/authorization、输出与部署；命令预设返回原生 Commander `Command` 供应用 `addCommand()`。[官方 CLI SDK 概览](https://office.univer.ai/cli/overview.md) [SDK README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/README.md)
4. **先用短生命 runtime**：官方建议先做每命令 load/close 的直接 runtime；只有测量证明重复加载是主要成本，且应用接受常驻内存与 worker 数量时，才加 pool + daemon。[官方 runtime 指南](https://office.univer.ai/cli/runtime-architecture.md)

## 示例设计时可直接采用的分组

下列分组仅是把上述 SDK 能力按同一执行链组织，不判断现有 examples 是否已覆盖：

1. **内容操作链**：headless 组合 → collaboration runtime → inspection → API find/show → content execution read/write → commit 状态处理。[官方最小 agent 流程](https://office.univer.ai/cli/content-operations.md)
2. **视觉检查链**：物化 UnitData → Render Page → Render Runtime → Screenshot / Slide Layout Lint → 最外层 close。[官方可视化检查流程](https://office.univer.ai/cli/visual-inspection.md)
3. **内容编译链**：SVG → Slide Facade code，或 Typst bundle → Doc Facade code/PNG preview，再由应用选择执行目标。[官方包目录](https://office.univer.ai/cli/packages.md)
4. **运行时复用链**：直接 runtime 基线 → worker runtime pool → daemon 跨 CLI invocation 复用，同时展示 key 语义、lease 串行、invalidate 和 shutdown。[官方 runtime 指南](https://office.univer.ai/cli/runtime-architecture.md)
5. **应用支撑能力**：config 用于已声明本地设置，resource library 用于 manifest 内可信视觉资源的查询、缓存和导出。[官方包目录](https://office.univer.ai/cli/packages.md)

## 与本仓库现有 examples 的对照

本仓库在提交 `7432988`（2026-08-25）包含四个递进式 example。它们与官站 `1.0.0-beta.2` 的学习路径完全对应：

| 现有 example | 已覆盖的主能力 | 仍未覆盖的同层能力 |
|---|---|---|
| [`01-content-operations`](../../examples/01-content-operations/README.zh-CN.md) | headless Univer、Collaboration Runtime、Content Execution、Content Inspection command、API Reference；Sheet、Doc、Slide | Base、Board；完整 commit 状态分支 |
| [`02-file-exchange`](../../examples/02-file-exchange/README.zh-CN.md) | Univer Pro Exchange 与 UnitData 边界 | CLI SDK 没有对应缺口；这是 Pro SDK 的应用组合示例 |
| [`03-visual-inspection`](../../examples/03-visual-inspection/README.zh-CN.md) | Render Page、Render Runtime、Screenshot、Slide Layout Lint | Base/Board screenshot；跨 Unit 公式引用；批量 operation 的 render runtime 复用 |
| [`04-worktree`](../../examples/04-worktree/README.zh-CN.md) | Worktree draft、Ready、Web review、Merge/Reopen/Discard；trunk/worktree inspection | Worker Runtime pool、daemon、跨 CLI invocation 复用 |

四个 example 合计直接声明了 25 个 CLI SDK package 中的 12 个。按能力而不是 package 数量计算，它们已经覆盖 16 组公开能力中的 9 组；没有形成可运行闭环的是 Runtime pool、daemon、SVG compiler、Typst compiler、config、Resource Library 和 generic keyed instance pool。

当前 `execute` 路径每次调用都会创建并关闭 Collaboration Runtime，`commit()` 只调用一次；当前 screenshot/lint 路径也会为每次 command 创建并关闭 Render Runtime。[04 的 Runtime 组装](../../examples/04-worktree/src/cli/features/unit-content.ts) [04 的视觉组装](../../examples/04-worktree/src/cli/features/visual.ts) 这不是现有 example 的错误：官站明确把短生命周期 runtime 作为起点，并把 Runtime reuse + Daemon 列为四个现有 example 之后的第五阶段。[官方 CLI SDK 概览](https://office.univer.ai/cli/overview.md) [官方 examples 清单](https://office.univer.ai/cli/examples.md)

### 版本差异

官站 requirements 与本仓库依赖都对应 `1.0.0-beta.2`。官站的 Package Catalog 因此仍把 Content Inspection 写成 Sheet、Doc、Slide；SDK `main` 的 `de3d8dc` 已经支持 Base、Board 的 headless composition、execution binding、inspection、render 和 screenshot，但使用的是 2026-08-31 Univer insiders 队列。[官站版本要求](https://office.univer.ai/requirements.md) [SDK 当前状态](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/docs/current-status.md)

Base/Board 是真实的示例缺口，但不能直接混入当前 beta.2 examples。应先等待或发布一组互相对齐的 `@univer-cli/*`、`@univerjs/*`、`@univerjs-pro/*` 版本，再基于该队列实现和验证。

## 建议新增的 examples

### 1. `05-runtime-reuse-daemon`：最高优先级

新增 `@univer-cli/univer-collaboration-runtime-pool`、`@univer-cli/daemon` 和 `@univer-cli/daemon-command` 的完整运行链。它直接补上官方递进学习路径缺少的第五阶段，也解决现有 command 每次重复加载 Unit 的成本。

示例应证明这些行为：

- CLI 每次只发送一个 application-defined JSON request；daemon 是 pool 的唯一长生命周期 owner。
- Worker entry 在 worker 内创建 Collaboration Backend 和 headless Univer；Snapshot、changeset 和 block 不经过 daemon。
- trunk 与 Worktree 对同一 `unitId` 使用不同 opaque key；同 key 请求 FIFO 串行，不同 key 可以并行。
- 获取 lease 后仍执行 `pull()`；write 路径处理 `confirmed`、`nothing-to-commit`、`pull-required`、`retry`、`unknown` 和 `conflict`，不能把一次 `commit()` 调用等同于成功。
- 成功且状态可信时 `release()`；timeout、worker crash、protocol error 或无法确认状态时 `invalidate()`；daemon shutdown 调用 `pool.close()`。
- `daemon status/start/restart/stop --json` 可运行；smoke test 能区分同一 key 的 cold load 与 hot reuse。

这个 example 不需要直接使用 `generic-keyed-instance-pool`。Collaboration Runtime pool 已经把相关 lifecycle 组合成 typed Worker lease，SDK 自己也要求 Univer Worker 场景从专用 pool 进入。

### 2. `06-resource-backed-slide`：Resource Library + SVG compiler

用 `@univer-cli/resource-library(-command)` 搜索并导出可信 registry 中的 SVG，再用 `@univer-cli/svg-facade(-command)` 编译成 Slide Facade program，写入 Worktree，最后复用现有 screenshot + layout lint + Web review。

这个闭环同时展示两个当前完全缺失、又天然相连的能力：Agent 先通过稳定 handle 选择视觉素材，再把素材确定性转换为可执行 Slide 内容。示例应保留 resource cache、可信 registry、外部 asset resolver、text measurer、compiler diagnostics，以及 stdout code 与 stderr warnings 的边界。

### 3. `07-typst-doc-authoring`：Typst compiler

用 `@univer-cli/doc-typst-facade(-command)` 把受约束的 Typst bundle 编译为 Doc Facade program，可选生成同源 PNG preview；应用检查 diagnostics 后，把 program 应用到协同 Doc，再通过 Content Inspection、Screenshot 或 Web 复核结果。

示例应显式展示 native binding 前提、bundle root 的路径安全、warning 与 error 的不同处理，以及 manifest `targetUnitId` 与真实协同 Unit identity 的区别。SVG 与 Typst 不应塞进同一个 example：二者的输入模型、native dependency、诊断和结果复核路径不同。

### 4. `08-base-board-operations`：版本对齐后补

在发布队列包含 SDK `main` 当前能力后，补齐 Base 和 Board 的 create / execute / inspect / screenshot 闭环：

- Base：overview 展示 Table、Field、record count 和 View；record values 或 View projection 用只读 Facade execution 补足；截图选择 table/view。
- Board：overview 展示 z-order、元素类型计数、背景和主题，再按 element ID 读取 detail；截图覆盖 content bounds、region 或 elements。

它复用已有 Content Execution、Inspection、Render Runtime 和 Screenshot，而不是引入新的 CLI SDK package。是否同时提供完整 Web 编辑器，应由对应发布队列的 Univer preset 支持决定；不应为凑齐页面而复制产品 UI。

## 不建议单独新增 example 的能力

- **`@univer-cli/config`**：在 `05` 需要可配置 server origin、socket path、TTL 或 capacity 时，以后续小改动接入并展示 `default|explicit|unset` 即可。单独项目只会重复 package README 的几行调用。
- **`@univer-cli/generic-keyed-instance-pool`**：它是通用进程内 lifecycle，不是 Univer 内容工作流。`05` 应使用 typed Collaboration Runtime pool；另做 browser/database toy example 会偏离本仓库目标。
- **直接调用 `@univer-cli/content-inspection`**：现有 examples 已通过 command preset 执行同一 capability。只有出现非 Commander consumer 时才值得增加 direct API 示例。
- **自定义 API reference artifact、Render Page composition 或底层 Render Runtime operation**：当前标准 artifact、preset Render Page 和上层 screenshot/lint 已覆盖主路径。出现自定义 SDK cohort、plugin 或 render operation 的真实需求后再补。

## 决策

立即规划三个有独立教学闭环的新增 example，顺序为 `05-runtime-reuse-daemon`、`06-resource-backed-slide`、`07-typst-doc-authoring`。把 Base/Board 记录为版本对齐后的下一项；config 只在新 example 出现真实配置需求时接入；不为 generic pool 和其他底层 seam 单独创建示例。
