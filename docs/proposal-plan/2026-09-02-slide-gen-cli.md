# Slide Gen CLI Proposal Plan

- 规划日期：2026-09-02
- Research Note：[`docs/research/2026-09-02-slide-gen-cli-scope.md`](../research/2026-09-02-slide-gen-cli-scope.md)
- Domain Model：[`CONTEXT.md`](../../CONTEXT.md)
- 已完成前序 Change：`add-resource-backed-slide-example`
- 本次已有空 Change：`evolve-resource-backed-slide-into-slide-gen-cli`

## Outcome

把已实现的 `06-resource-backed-slide` 演进为独立的 `slide-gen-cli` Agent application。用户提交 Presentation Brief 后，Agent 可以生成不受单页限制的 Resource-backed Slide deck，在 Worktree 中逐页修订并收集 Review Evidence，通过 Review URL 在线交付，并按需导出 PPTX。

本次只规划和提出 Changes，不实现、不验证实现、不归档。

## Proposal Run 前置条件

`add-resource-backed-slide-example` 已完成 6/6 tasks，但尚未归档，当前 `openspec/specs/` 为空。新 Changes 要连续修改 `resource-backed-slide-authoring` capability，必须先完成：

1. `$tina-verify add-resource-backed-slide-example`；
2. 若 verify 通过，由用户显式执行 `$openspec-archive-change add-resource-backed-slide-example`；
3. 确认归档后的主 spec 包含 `resource-backed-slide-authoring`。

若前序 Change 未通过 verify、未归档或主 spec 未生成，proposal run 必须停止，不得把同名 capability 重新声明为互相冲突的 ADDED capability。

## Ordered Change List

### 1. `evolve-resource-backed-slide-into-slide-gen-cli`

**Intent：** 把编号教学 example 改造成具有稳定身份和 Slide-only 运行边界的 `slide-gen-cli` application，同时保留 Agent 查询、Worktree 审阅、视觉检查、PPTX export 和 Web Viewer。

**Dependency：** 前序 `add-resource-backed-slide-example` 已验证并归档。

**Capability：** 修改归档后的 `resource-backed-slide-authoring`，只处理 application identity、支持的 Unit/command surface 和交付通路；不在本 Change 引入多页 Authoring Source 或 Native Enhancement workflow。

**Scope：**

- 将目录、package、binary、标题和根索引统一为 `slide-gen-cli`，并把它从编号教程表移到独立 Agent application 区域。
- CLI、shared types、Server 和 Web 收敛为 Slide-only；删除 Sheet、Doc 和 Office import。
- 保留 API reference、Resource Library、SVG compiler、execute、Worktree lifecycle、inspect、lint、screenshot、render page、open 和 Web review actions。
- 保留 trunk/Worktree PPTX export，并把 export command 收敛为 `.pptx` only。
- 保留当前单页 Baseline 行为作为迁移期兼容输入；deck authoring contract 由后续 Change 修改。

**Completion criteria：**

- 用户可通过 `slide-gen-cli create` 创建 Slide Unit，不再选择 Unit type。
- `slide-gen-cli import`、Sheet 和 Doc 创建/加载路径不可用；`slide-gen-cli export <file.pptx>` 可从 trunk 或 Worktree 导出。
- Worktree Ready/Reopen/Merge/Discard、API reference、inspection、layout lint、screenshot 和 Review URL 行为保持可用。
- Web app 只创建和加载 Slide，同时保持 trunk/Worktree routing 与 review actions。
- package/lockfile 不再声明仅服务 Sheet/Doc presets 的 direct dependencies；PPTX exchange dependencies 保留。
- Slide-only regression tests、中英文 README、root index、build、typecheck、lint 和 tests 全部通过。
- Proposal、delta spec、design 和 tasks 合计不超过一个 intent、一个 modified capability 和约七个 coarse tasks。

### 2. `enable-agent-deck-authoring-in-slide-gen-cli`

**Intent：** 让 Agent 根据 Presentation Brief 创建、修订、验证和交付多页 Resource-backed Slide deck，并支持可重放的 native chart/table authoring。

**Dependency：** Change 1 完成 proposal；实现时依赖 Change 1 已应用并提供稳定的 `slide-gen-cli` 路径、binary 和 Slide-only runtime。

**Capability：** 继续修改 `resource-backed-slide-authoring`，把单页合同扩展为 deck-level Authoring Source、per-page generation、Native Enhancement 和 deck delivery。

**Scope：**

- Authoring Source 包含 Presentation Brief/deck spec、逐页 SVG、导出资源和可选 Native Enhancements；compiled Facade programs 仍是 disposable output。
- 初次生成按 page 1 到 N 顺序执行；已有页 replace，`pageCount + 1` append，跳页失败；不新增 deck compiler、`--apply` adapter 或 orchestrator。
- 一个 Resource-backed Slide deck 只要求至少一页引用 stable-handle Resource Library asset，不要求每页都有装饰资源。
- Chart/table 既可由 SVG 表达，也可作为最后一次 page replacement 后重放的 Native Enhancement；普通 shape/text/image 仍以 SVG 为 source。
- Web Viewer 注册 Slide chart/table plugins、styles 和 locales；不增加 Sheet/Doc capability。
- 每页收集 inspection、layout findings 和 screenshot，最终做 deck-level consistency assessment；Ready 后返回 Review URL，并按用户要求导出 PPTX。
- Baseline Deck 保持精简且至少两页；native chart/table 使用独立 fixture 验证，不强制进入 Baseline Deck。

**Completion criteria：**

- committed Baseline Deck 至少两页，并保留确定性的 stable-handle resource 与离线 fake downloader 测试接缝。
- 自动测试证明 existing-page replace、next-page append 和 skipped-page rejection。
- `univer-slide-authoring` skill 不限制页数、chart、table 或 PPTX export，并明确首次顺序生成、逐页修正、Native Enhancement replay 和 deck review。
- 最小 native chart/table fixture 可被 inspect、render、lint、screenshot 和 Web Viewer 正确处理。
- Native chart 显式设置 category/value mapping；PPTX 验收检查 exporter diagnostics、chart XML、embedded workbook 和 table slide XML，不只检查 ZIP signature。
- Ready Worktree 可以提供 Review URL，并按需导出包含预期 deck pages 与 native elements 的 PPTX。
- 中英文 README 以 Presentation Brief → Agent → Ready Review URL/PPTX 为主故事；不新增 import、template system、public hosting、auth、daemon 或 runtime pool。
- Proposal、delta spec、design 和 tasks 合计不超过一个 intent、一个 modified capability 和约八个 coarse tasks。

## Dependencies and Parallelism

```text
verify/archive add-resource-backed-slide-example
  → evolve-resource-backed-slide-into-slide-gen-cli
  → enable-agent-deck-authoring-in-slide-gen-cli
```

两个 Changes 不可并行。第二个 Change 的 artifacts 必须读取第一个 Change 的最终 artifacts，并以其确定的路径、binary、Slide-only surface 和 dependency closure 为基础。Proposal run 可以顺序创建两组 artifacts；不得并行提案后再猜测合并冲突。

## Confirmed Constraints

- 用户产物统一称为 Slide deck；Slide Unit 是协作容器；page 是单页。
- `slide-gen-cli` 不设置人为页数上限，但首次生成必须连续递增 page number。
- Authoring Source 是可重建 deck 的维护输入；generated compiler programs 不提交为 source。
- 至少一页使用 Resource Library stable-handle asset 即满足 Resource-backed Slide deck，不要求每页使用。
- API reference、Worktree、inspect、lint、screenshot、render page、Web Server/Viewer 和 PPTX export 全部保留。
- Import、Sheet 和 Doc application surface 移除；Slides 内部所需 Docs/Drawing plugins 不按名称误删。
- Native chart/table 是允许且可验证的 optional authoring path；不强制放进 Baseline Deck。
- Page SVG replacement 会删除 native elements；Native Enhancement 必须保留 source 并在 replacement 后重放。
- Native chart PPTX export 必须设置 category/value mapping，并检查 exporter diagnostics 与 OOXML entries。
- Review URL 只在内置 Web Server 运行期间有效，不承诺公网部署、认证或永久分享。
- 保持公开 beta.2 Univer cohort；新增 Slide chart/table Web packages 必须与该 cohort 对齐。
- 不增加 custom compile adapter、deck orchestrator、template system、daemon、runtime pool 或新的持久化格式。
- 不修改 `01`–`04` examples 的行为。
- 无 ADR：这些决策局限于一个 example，尚不满足 hard-to-reverse 条件。

## Overall Stopping Condition

Proposal run 只有在以下条件全部满足时完成：

- 前序 capability 已存在于主 specs；
- 两个 Changes 都具有通过 Tina schema 校验的 proposal、delta spec、必要 design 和不超过八项的 tasks；
- 每个 Change 只有一个 intent，且没有把第二个 Change 的 deck authoring 工作隐藏进第一个 Change；
- 第二个 Change 明确依赖第一个 Change，所有 paths、commands、domain terms 和 capability operations 一致；
- final global review 没有发现单页限制、禁止 chart/table/PPTX、保留 import/Sheet/Doc、错误的 public URL 承诺或只检查 PPTX ZIP signature 等回归；
- proposal run 不实现、不 archive，也不生成未经请求的 `change.html`。

达到停止条件后，向用户报告两个 Changes 的 artifact paths、size-gate 结果和后续实现顺序。若任一 Change 超过 size gate，停止并报告需要再次拆分，不得压缩成 oversized tasks。
