## Why

`06-resource-backed-slide` 已具备 Agent skill、Resource Library、SVG compiler、Worktree 审阅、视觉检查、Web Viewer 和 PPTX export 所需基础，但编号教学 example 的身份及 Sheet、Doc、Office import 分支掩盖了它的 Slide authoring 用途。现在先把它收敛为具有稳定名称和 Slide-only 运行边界的 `slide-gen-cli` application，为后续 deck authoring contract 提供明确基线。

## What Changes

- **BREAKING**：把 `examples/06-resource-backed-slide/` 重命名为 `examples/slide-gen-cli/`，并统一 package、binary、页面标题、skill 命令示例和根索引中的 `slide-gen-cli` 身份；根索引把它列入独立 Agent application 区域。
- **BREAKING**：把 CLI、shared types、Server 和 Web 收敛为 Slide-only；`create` 固定创建 Slide Unit，不再接收 Unit type，删除 Office `import`、Sheet 和 Doc 创建/加载路径。
- **BREAKING**：把 `export` 收敛为 `.pptx` only，同时保留 trunk 与 Worktree target。
- 保留 API reference、Resource Library、SVG compiler、execution、Worktree lifecycle、inspection、layout lint、screenshot、render page、`open`、Web review 和 Review URL。
- 保留现有单页 `authoring/page.svg`、stable-handle resource、compile/execute 和 Review Evidence 行为，作为迁移期兼容输入；清理仅服务 Sheet/Doc presets 的 direct dependencies，并保留 Slides 内部 Docs/Drawing 与 PPTX exchange 依赖。
- 更新 Slide-only regression tests、中英文 README、skill 文案和根索引。

## Scope

**Intent:** 把编号教学 example 演进为具有稳定 `slide-gen-cli` 身份和 Slide-only runtime/command surface 的 Agent application，同时保持既有 Resource-backed Slide 审阅与 PPTX 交付通路可用。

**Non-Goals:** 不在本 Change 引入多页 Authoring Source、Presentation Brief 驱动的 deck workflow、page append/replace contract、Native Enhancement、native chart/table、chart/table Web plugins、deck-level Review Evidence、template system、public hosting、auth、daemon、runtime pool 或新的持久化格式；不修改 `01`–`04` examples。

**Size Gate:** 一个 intent、一个 modified capability、预计七个粗粒度任务；范围是一次 focused implementation session 内的身份迁移与分支删除。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `resource-backed-slide-authoring`: 把 application identity、支持的 Unit/command surface 和交付通路改为 `slide-gen-cli` 的 Slide-only contract，同时保留现有单页 authoring baseline。

## Domain Alignment

本 Change 遵循 [`CONTEXT.md`](../../../CONTEXT.md) 中的 `Resource-backed Slide`、`Resource-backed Slide deck`、`Authoring Source`、`Review Evidence` 与 `Review URL`。当前单页 `authoring/page.svg` 只是迁移期兼容输入，不在本 Change 扩展 `Authoring Source` 或声明 `Baseline Deck` 行为。No domain-model change；不需要 ADR。

## Impact

- 路径与身份：`examples/06-resource-backed-slide/`、package metadata、binary、Web title、skill 脚本/文案、中英文 README 和根 README 索引。
- CLI/shared：composition root、Unit type mapping、Slide create、PPTX-only export，以及现有 Worktree、inspection、execution、API、resource、compile、visual 和 open commands。
- Server/Web：`/api/units` 的 Slide-only create contract、trunk/Worktree collaboration routing、review actions 和只加载 Slide 的 Viewer。
- 依赖与验证：example lockfile、Sheet/Doc preset direct dependencies、保留的 PPTX exchange dependency closure，以及 Slide-only command/smoke/Web regression coverage。
- Scope 与约束依据：[`docs/proposal-plan/2026-09-02-slide-gen-cli.md`](../../../docs/proposal-plan/2026-09-02-slide-gen-cli.md) 和 [`docs/research/2026-09-02-slide-gen-cli-scope.md`](../../../docs/research/2026-09-02-slide-gen-cli-scope.md)。
