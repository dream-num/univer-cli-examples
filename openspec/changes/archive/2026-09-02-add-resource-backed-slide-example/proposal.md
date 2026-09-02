## Why

现有四个 examples 已展示内容操作、文件交换、视觉检查和 Worktree 审阅，但 Agent 尚不能通过 CLI SDK 的 Resource Library 选择视觉素材，再把 SVG Authoring Source 编译成可审阅的 Univer Slide。新增一个单页教学 example，可以把这两项已发布的 beta.2 能力组成完整、可运行且可验证的 authoring workflow。

## What Changes

- 新增独立的 `06-resource-backed-slide` example，保留 `04-worktree` 的完整命令面与协作、渲染、Web review 基础设施。
- 装配 Resource Library 与 SVG compiler 的标准 beta.2 command presets，使用官方 CLI asset manifest、application-owned cache root 和 deterministic text estimator。
- 提供一张“产品发布状态”Baseline Slide；真实流程通过固定 stable handle 导出资源，编译生成 disposable Facade program，再通过既有 `execute --file` 写入 Worktree。
- 用专用 `univer-slide-authoring` skill 指导 Agent 修改单页 Authoring Source、处理 diagnostics，并用 Review Evidence 完成视觉修正和 Ready handoff。
- 增加离线可重复的 resource/compile/runtime smoke coverage，并更新中英文 README 与根索引。

## Scope

**Intent:** 提供一个可复制的单页 Resource-backed Slide 教学闭环，使 Agent 能从稳定资源 handle 开始，经 SVG compile 和 Worktree commit，交付经过结构、布局与截图验证的 Slide。

**Non-Goals:** 不新增自定义 `compile-svg --apply`、browser-backed text measurer、daemon、runtime pool 或持久化格式；不覆盖多页 deck、chart、table、PPTX export、自动选图或通用模板系统；不改变既有 examples 的依赖或行为。

**Size Gate:** 一个 intent、一个新 capability、六个粗粒度任务，复用 `04-worktree` 的运行链，可在一次 focused implementation session 完成。

## Capabilities

### New Capabilities

- `resource-backed-slide-authoring`: 通过 Resource Library、SVG compiler、Worktree execution、专用 Agent skill 与 Review Evidence 创建和交付单页 Resource-backed Slide。

### Modified Capabilities

- 无。

## Domain Alignment

本 Change 使用 [`CONTEXT.md`](../../../CONTEXT.md) 中的 `Resource-backed Slide`、`Authoring Source`、`Baseline Slide` 与 `Review Evidence`。这些术语已在 planning session 中确认；本 Change 不再修改领域模型，也不需要 ADR。

## Impact

- 新增 `examples/06-resource-backed-slide/`，主体从 `examples/04-worktree/` 复用。
- 新增四个 `@univer-cli/*@1.0.0-beta.2` package 与 `@univerjs-pro/cli-assets@0.1.0`，既有 beta.2 Univer cohort 保持不变。
- composition root 新增 `resources` 与 `compile-svg` commands，并提供可注入的 Resource Library 测试接缝。
- 新增 Baseline Slide、专用 skill、运行产物 ignore 规则、smoke coverage，以及中英文 example 文档和根索引。
- 版本与 API 依据见 [`docs/research/2026-09-02-resource-backed-slide-package-versions.md`](../../../docs/research/2026-09-02-resource-backed-slide-package-versions.md)，完整 scope 依据见 [`docs/research/2026-09-02-resource-backed-slide-feasibility.md`](../../../docs/research/2026-09-02-resource-backed-slide-feasibility.md)。
