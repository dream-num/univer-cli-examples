## Why

前序 Change 只把现有单页 workflow 迁移到稳定的 `slide-gen-cli` Slide-only application，仍无法把用户的 Presentation Brief 转成可维护、可逐页修订和整体验收的 Slide deck。`@univer-cli/svg-facade` 已提供已有页 replace、下一页 append 与跳页 rejection 语义；本 Change 用这些现有能力建立 deck authoring contract，并补齐可选 native chart/table 的可重放 source、Viewer 支持和 PPTX 验收。

## What Changes

- 将 Authoring Source 扩展为 Presentation Brief/deck spec、逐页 SVG、stable-handle 导出资源和可选 Native Enhancements；compiled Facade programs 继续作为 disposable output。
- 定义无人工页数上限的逐页生成语义：首次生成从 page 1 连续递增；已有 page 被 replace；仅 `pageCount + 1` 可 append；跳过 page number 必须失败。
- 将 Resource-backed Slide deck 的资源要求设为全 deck 至少一页引用 stable-handle asset，并把 committed baseline 升级为至少两页的 Baseline Deck。
- 允许 chart/table 由 SVG 表达，或在目标 page 最后一次 SVG replacement 后通过已保存的 Native Enhancement 插入；普通 shape、text 与 image 继续以 SVG 为 source，后续 page replacement 后必须重放对应 enhancement。
- 在 Web Viewer 注册公开 beta.2 cohort 的 Slide chart/table plugins、styles 与 locales，保持 trunk/Worktree routing 和 review actions。
- 将 Review Evidence 扩展为逐页 inspection、layout findings、screenshot 和 deck-level consistency assessment；Ready 后返回 Server-scoped Review URL，并按用户请求从同一 Worktree 导出 PPTX。
- 用独立最小 fixture 验证 native chart/table：chart 必须显式设置 category/value mapping，PPTX 验收必须检查 exporter diagnostics、chart XML、embedded workbook 和 table slide XML。
- 更新 `univer-slide-authoring`、中英文 README 与 tests，使 Presentation Brief → Agent → Ready Review URL/可选 PPTX 成为主 workflow。

## Scope

**Intent:** 让 Agent 根据 Presentation Brief 创建、修订、验证、审阅并交付多页 Resource-backed Slide deck，同时支持可重放的 editable native chart/table authoring。

**Non-Goals:** 不重新引入 Sheet、Doc 或 Office import；不再次修改 `slide-gen-cli` identity；不新增 deck compiler、orchestrator、custom `--apply` adapter、template system、public hosting、auth、daemon、runtime pool 或 persistence；不修改 `01`–`04` examples。Native Enhancement 不用于普通 shape、text 或 image authoring，Baseline Deck 不承担完整 native feature showcase。

**Size Gate:** 一个 intent、一个 modified capability、预计八个 coarse tasks；复用既有 per-page compiler、execution、Worktree、inspection、render 与 export surfaces，可在 Change 1 应用后的一次 focused implementation session 内完成。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `resource-backed-slide-authoring`: 将前序 Change 的单页兼容 contract 扩展为 Presentation Brief 驱动的 deck-level Authoring Source、逐页生成与修订、可选 Native Enhancement、deck Review Evidence 和 Ready URL/PPTX delivery。

## Domain Alignment

本 Change 使用 [`CONTEXT.md`](../../../CONTEXT.md) 中的 `Resource-backed Slide deck`、`Presentation Brief`、`Authoring Source`、`Native Enhancement`、`Baseline Deck`、`Review Evidence` 与 `Review URL`。其中“至少一页引用 stable-handle asset”、compiled programs 为 disposable output、Review URL 仅在内置 Server 运行期间有效等边界直接沿用 glossary。No domain-model change；不需要 ADR。

## Impact

- 前置依赖：实现时要求 `evolve-resource-backed-slide-into-slide-gen-cli` 已应用，提供 `examples/slide-gen-cli/`、`slide-gen-cli` binary 和 Slide-only runtime。
- Authoring 与 Agent workflow：`examples/slide-gen-cli/authoring/`、`.generated/`、`skills/univer-slide-authoring/SKILL.md` 和 skill validation。
- Web 与依赖：Slide-only Viewer composition、chart/table styles/locales，以及 `@univerjs-pro/slides-chart`、`@univerjs-pro/slides-chart-ui`、`@univerjs-pro/slides-table`、`@univerjs-pro/slides-table-ui` 的公开 beta.2 direct dependencies。
- 验证与交付：per-page compiler/execution/inspection/lint/screenshot coverage、deck consistency review、Worktree Ready/Review URL、PPTX exporter diagnostics 与 OOXML assertions。
- 文档：`examples/slide-gen-cli/README.md` 与 `README.zh-CN.md` 的 Presentation Brief 主故事。
- 依据：[`docs/proposal-plan/2026-09-02-slide-gen-cli.md`](../../../docs/proposal-plan/2026-09-02-slide-gen-cli.md)、[`docs/research/2026-09-02-slide-gen-cli-scope.md`](../../../docs/research/2026-09-02-slide-gen-cli-scope.md) 与前序 Change artifacts。
