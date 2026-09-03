## Context

`evolve-resource-backed-slide-into-slide-gen-cli` 的计划 post-state 已提供 `examples/slide-gen-cli/`、`slide-gen-cli` binary、Slide-only runtime、单页 `authoring/page.svg`、per-page `compile-svg`/`execute`、Worktree review、Review URL 和 trunk/Worktree PPTX export。本 Change 在该 surface 上建立 deck contract；实现顺序依赖前序 Change 已应用，不再改 application identity 或 Unit boundary。

本地 `@univer-cli/svg-facade` 的 1-based wrapper 已处理三种 page transition：替换已有 page、在 `pageCount + 1` append、拒绝更大的 page number。因此多页 authoring 不需要新 command、compiler adapter 或 orchestrator。跨 authoring source、Agent skill、Web plugin composition、PPTX acceptance 和 tests 的约束需要统一设计。领域词汇来自 [`CONTEXT.md`](../../../CONTEXT.md)，范围依据 [`proposal.md`](./proposal.md)、[`docs/proposal-plan/2026-09-02-slide-gen-cli.md`](../../../docs/proposal-plan/2026-09-02-slide-gen-cli.md) 与 [`docs/research/2026-09-02-slide-gen-cli-scope.md`](../../../docs/research/2026-09-02-slide-gen-cli-scope.md)；无 ADR。

## Goals / Non-Goals

**Goals:**

- 用最小的 deck-level Authoring Source 让 Agent 从 Presentation Brief 重建任意页数的 Slide deck。
- 复用既有 per-page compile/execute surface，固定首次连续生成、已有页替换、下一页追加和跳页失败语义。
- 为 editable native chart/table 建立可维护、可重放、可 inspect/render/export 的 enhancement path。
- 让每页 Review Evidence、deck consistency review、Ready Review URL 和可选 Worktree PPTX 构成同一交付链。
- 用精简 Baseline Deck 与独立 native fixture 分别承担常规 workflow 和 native export acceptance。

**Non-Goals:**

- 不添加 deck compiler、文件发现 command、orchestrator、custom `--apply` adapter 或并行 page scheduler。
- 不为 Authoring Source、Review Evidence 或 Presentation Brief 新增数据库、manifest schema 或 persistence service。
- 不重新开放 Sheet、Doc、Office import，也不加入 template system、public hosting、auth、daemon 或 runtime pool。
- 不允许 Native Enhancement 绕过 SVG 来 author 普通 shape、text 或 image，不修改 `01`–`04` examples。

## Diagram design (Optional)

```text
Presentation Brief / deck spec
  ├─ <task-dir>/pages/page-NN-*.svg ── compile-svg --page N ──┐
  ├─ <task-dir>/resources/<stable-handle>.svg                 ├─ execute → Slide Worktree
  └─ <task-dir>/enhancements/page-NN-*.js ─ after replacement┘
                                                               │
每页 inspect + lint + screenshot ── deck consistency review ──┤
                                                               ↓
                                      Ready Review URL + optional Worktree PPTX
```

## Decisions

### 1. Authoring Source 使用目录约定，不增加 manifest 或 deck compiler

Agent 为每个 deck 选择一个独立任务目录；目录名与位置由用户或 Agent 决定。仓库中的 Baseline Deck 使用 `authoring/product-release/` 作为示例，但 skill 不把该位置作为要求：

```text
<task-dir>/
  deck.md
  pages/page-NN-*.svg
  resources/<registry>--<resource>.svg
  enhancements/page-NN-*.js  # optional
  .generated/page-NN.js       # disposable, ignored
  output/                     # disposable, ignored
```

`deck.md` 保存 Presentation Brief 或等价 deck specification、叙事顺序与逐页内容合同；pages、resources 和 enhancements 是维护输入。generated programs、review evidence 和导出文件也留在同一任务目录下，避免并行或可恢复任务互相覆盖。文件名的两位数字只提供可读排序，不构成页数上限。`slide-gen-cli` 不扫描或批量执行该目录；Agent 依照 skill 调用现有 commands，避免引入第二套 execution abstraction。Resource-backed 条件在 deck 级判断，只要求至少一个 page SVG 引用 stable-handle export。

### 2. 多页生成直接采用既有 1-based page transition

初次生成从 page 1 向上连续执行。目标 `1..pageCount` 走 replace，目标 `pageCount + 1` 走 append，目标大于 `pageCount + 1` 保留 wrapper 的 out-of-range failure。修订可以直接替换任意已存在 page，不要求重跑其他 pages。每次 compile 和 execute 仍是独立两步，任一 commit 未 confirmed 时停止；不加人工 page cap、批处理 command 或 hidden retry。

### 3. Native Enhancement 只补充 SVG compiler 无法表达的 editable semantics

Chart/table 默认可以由 page SVG 的普通视觉 elements 表达。需要 editable native semantics 时，page SVG 先定义完整背景、普通内容和预留区域；目标 page 最后一次 replacement confirmed 后，再通过 `execute --file` 运行保存于 `<task-dir>/enhancements/` 的 program。因为 full-page replacement 会删除该 page 的全部 elements，Agent 每次修改 SVG 后必须重放对应 enhancement，再重新 inspect、lint 和 screenshot。

Native chart program 通过当前 API reference 确认 Facade surface，并显式配置 category field 与 value fields mapping。一次性 shell snippet、普通 drawing calls 和 generated compiler program 不得冒充 Native Enhancement source。

### 4. Web Viewer 以同 cohort 的 Slide chart/table packages 补齐 native rendering

在 Change 1 的 Slide-only Viewer composition 中加入 `@univerjs-pro/slides-chart`、`@univerjs-pro/slides-chart-ui`、`@univerjs-pro/slides-table` 和 `@univerjs-pro/slides-table-ui` 的 `1.0.0-beta.2` direct dependencies，并注册各自 plugins、styles 与 `en-US` locales。既有 Slides 所需 Docs/Drawing closure、collaboration plugins、trunk/Worktree load path 和 review actions 保持不变；不恢复 Sheet/Doc presets。

### 5. Review Evidence 按 page 收集，deck consistency 由同一 Agent workflow 汇总

Agent 对每个 page 保留 compile diagnostics、structured inspection、layout findings 和 screenshot review，并在 Ready 前比较叙事顺序、字体、颜色、资源风格、page size 与 native element placement。该 assessment 是交付 evidence，不增加服务端表或自定义 review engine。缺陷只触发受影响 page 的 replacement，以及该 page 的 enhancement replay。

全部 checks 通过后，Agent 将 Worktree 标记 Ready，并用现有 `open --no-launch` 返回指向同一 Unit/Worktree 的 Review URL。只有用户要求文件时才从同一 Worktree revision 调用现有 `.pptx` export；URL 只在内置 Web Server 运行期间有效。

### 6. Baseline Deck 与 native fixture 分担不同验收职责

Committed Baseline Deck 从现有 960 × 540 单页视觉合同演进为至少两个连续 pages，继续使用 fixed manifest、fake downloader 和 canonical rocket stable handle。它验证 Authoring Source、连续 generation、replace/append/reject、per-page evidence 与 Ready handoff，不因可选 native path 膨胀。

独立最小 fixture 在专用 Worktree/page 中加入一个 native chart 和一个 native table。验收先证明 inspect、render、lint、screenshot 与 Web Viewer 可处理两者，再导出 PPTX：必须检查 exporter diagnostics，并读取 OOXML entries 断言 chart XML、embedded workbook 与含 table 的 slide XML，不能把 ZIP signature 当作成功标准。优先复用当前 dependency closure 中的 archive test helper；不为单个 assertion 建立新的 production abstraction。

### 7. `univer-slide-authoring` 与 README 描述同一无上限 deck workflow

Skill 从 Presentation Brief 开始，指导 Agent 形成 deck spec、导出资源、从 page 1 连续生成、局部替换、按需重放 Native Enhancement、逐页检查、deck consistency review、Ready URL 和可选 PPTX。它删除单页、chart/table 和 PPTX 禁令，同时继续排除 import、template system 与普通元素的手写 Facade authoring。中英文 README 以同一 brief-to-delivery 故事为主入口，完整 command 参数仍由 CLI help 承担。

## Risks / Trade-offs

- **Agent 在 replacement 后遗漏 enhancement replay** → skill、spec 和 smoke fixture 使用同一顺序，并在 inspection/screenshot/export 中断言 native element 仍存在。
- **chart/table Web packages 与现有 Univer packages 版本不一致** → 四个 direct dependencies 固定到现有公开 `1.0.0-beta.2` cohort，并以 frozen install、typecheck、build 和真实 Viewer QA 验证。
- **exporter 返回文件但丢弃 mapping 无效的 chart** → 验收把 diagnostics 与 OOXML structure 作为成功条件，ZIP signature 仅能证明容器可读。
- **Baseline Deck 变成 native feature showcase** → baseline 只保留至少两页的资源型主 workflow，chart/table 放在独立最小 fixture。
- **无人工 page cap 会暴露运行资源上限** → 不声明虚假的无限容量；现有 runtime 的正常 memory、timeout 和错误传播继续生效，application 不额外拒绝某个页数。

## Migration Plan

1. 在 Change 1 已应用的 `examples/slide-gen-cli/` 中，把 committed 单页 source 移入 deck-level authoring layout，并增加第二个 baseline page；不迁移 ignored generated/runtime output。
2. 扩展 skill、tests 与文档以使用既有 per-page commands，再加入 optional enhancement source 与 Web chart/table composition。
3. 完成 baseline、native fixture、Web Viewer 和 PPTX OOXML acceptance；不做数据库或 collaboration data migration。

若回退本 Change，恢复单页 authoring source/skill/tests 并移除四个 Viewer direct dependencies 与注册；Change 1 的 `slide-gen-cli` identity、Slide-only surface、Worktree 数据和 PPTX-only export 保持不变。

## Open Questions

无。会改变行为、实现路径或任务拆分的问题已经由 proposal plan 确认。
