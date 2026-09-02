## Context

当前 `examples/06-resource-backed-slide/` 从 `04-worktree` 继承了 Sheet、Doc、Slide 三种 Unit 的 CLI、Server 和 Web 分支，随后叠加了 Resource Library、SVG compiler、单页 Authoring Source 和 `univer-slide-authoring` skill。这个 Change 要在保留 collaboration/runtime/render/review 链的前提下完成目录与 package 迁移，并跨 CLI、shared types、Server、Web、tests 和 docs 删除跨 Unit 分支，因此需要 design 约束删除边界。

领域词汇来自 [`CONTEXT.md`](../../../CONTEXT.md)，范围和已确认的先后关系来自 [`docs/proposal-plan/2026-09-02-slide-gen-cli.md`](../../../docs/proposal-plan/2026-09-02-slide-gen-cli.md)，代码与 dependency closure 依据见 [`docs/research/2026-09-02-slide-gen-cli-scope.md`](../../../docs/research/2026-09-02-slide-gen-cli-scope.md)。本 Change 不作 ADR。

## Goals / Non-Goals

**Goals:**

- 用 `examples/slide-gen-cli/`、`@univer-cli-example/slide-gen-cli`、`slide-gen-cli` 和 `Slide Gen CLI` 建立一致的 application identity。
- 让 application-owned CLI、shared types、Server 和 Web 只创建、加载、执行、审阅和导出 Slide Unit。
- 保留 Resource Library、SVG compiler、API reference、Worktree、Review Evidence、Review URL、render page 与 trunk/Worktree PPTX export。
- 保持当前单页 `authoring/page.svg` workflow 可回归，为后续 Change 提供稳定迁移基线。

**Non-Goals:**

- 不设计或实现多页 Authoring Source、page append/replace contract、Presentation Brief orchestration 或 deck-level review。
- 不加入 Native Enhancement、native chart/table、chart/table Web plugins 或相应 dependencies。
- 不为通用 SDK command preset 分叉一套只隐藏 Sheet/Doc help 项的 commands；application 的支持边界由 create/load/runtime contracts 固定为 Slide。
- 不迁移旧目录中的 ignored `.data`、generated programs、screenshots 或其他运行产物，也不修改 `01`–`04` examples。

## Diagram design (Optional)

```text
slide-gen-cli CLI ─┬─ create Slide ───────────────┐
                  ├─ resources → compile-svg     │
                  ├─ execute/inspect/lint/shot ──┼→ Slide trunk or Worktree
                  └─ export .pptx / open URL ────┘             │
                                                               ↓
Slide-only Server API ← collaboration transport → Slide-only Web Viewer
                                                    Ready/Reopen/Merge/Discard
```

## Decisions

### 1. 一次性迁移到新身份，不保留旧 alias

实现以目录 move 开始，再统一 package name、binary、CLI description、Web title、skill 命令示例、中英文 README、root index 和 lockfile importer identity。旧目录与 `univer-example-cli` binary 不保留 compatibility alias，因为二者继续存在会让 application identity 保持双重状态，并增加后续文档与测试分支。

### 2. shared contract 只保留 `slide` literal，不再传播 Unit union

`UnitSummary` 可以继续携带 `unitType: "slide"` 作为 Server/Web wire metadata，以复用现有 SQLite row 和列表展示；shared code 删除 Sheet/Doc union、label switch 和 instance-type conversion branches。CLI runtime、render input 和 Web collaboration load path固定使用 Slide 类型，并在读取外部 metadata 时只接受 `slide`。相比立即改动 SQLite table shape，这个方案删除运行分支，同时避免无价值的 database migration。

### 3. Server create endpoint 始终构造空 Slide snapshot

`POST /api/units` 只从 request 读取 `unitId` 与 `name`，直接调用 `getSlidesEmptySnapshot` 创建 Slide；删除 workbook/document constructors 与 imported `data` dispatch。遗留 `type` 或 `data` 字段不能选择另一个 Unit 类型或触发 Office import。collaboration database、endpoint、UnitStore、WorktreeStore 和 trunk/Worktree transports 保持原边界。

### 4. 删除 import command，并把 export 缩成一个 PPTX path

composition root 不再注册 `import`。file feature 只加载指定 trunk 或 Worktree 的 Slide runtime，校验 `.pptx` extension，并用现有 exchange packages 导出 PPTX；删除 XLSX、DOCX、import format detection 和跨类型 switch。`--trunk` 与 `--worktree` 仍互斥且必须二选一，避免改变 target semantics。

### 5. Web Viewer 使用显式 Slide preset，保留 review routing

Web create form 删除 Unit type selector；“New” 直接请求 Slide。Viewer 删除 Sheet/Doc presets、locales 与 `loadSheetAsync`/`loadDocAsync` 分支，保留 Slide 本身需要的 Docs、Drawing、Render、UI 和 Network plugins。trunk URL、带 `unit`/`worktree` query 的 Review URL、draft/ready inert state 以及 Ready、Reopen、Merge、Discard actions 原样保留。本 Change 不注册 Slide chart/table plugins；该能力属于后续 Change。

### 6. 依赖清理以实际 application preset 为界

package manifest 删除 `@univerjs/preset-sheets-core` 与 `@univerjs/preset-docs-core`，并随 importer identity 重写 lockfile。`@univerjs/docs*`、`@univerjs/drawing*` 等 Slides 内部依赖不能因名称误删；`@univerjs-pro/exchange-node` 与 binding 为 PPTX export 保留。其余依赖只在 import graph、peer requirements、build、typecheck、render 与 export 验证证明无用时删除，不做猜测性 cleanup。

### 7. 当前单页 authoring baseline 保持原样

保留 `authoring/page.svg`、canonical stable-handle resource、`compile-svg --page 1`、`execute --file`、inspection、layout lint、screenshot 和 Ready handoff。`univer-slide-authoring` 只更新 application path/binary 和身份文案，不在本 Change 引入 Presentation Brief、多页、chart/table 或 Native Enhancement workflow。后续 Change 将在本 Change 的 Slide-only surface 上独立修改 deck contract。

## Risks / Trade-offs

- **误删 Docs/Drawing packages 会破坏 Slide editor 或 renderer** → 按实际 Slide plugin imports 和 peer requirements 保留 dependency closure，并以 Web build、typecheck、screenshot 与 Viewer 验证兜底。
- **通用 API/inspection presets 可能仍在局部 help 中展示跨 Unit 词汇** → 不 fork SDK commands；create、Server、runtime、Web 和 docs 固定支持 Slide，tests 验证跨 Unit 数据无法进入 application lifecycle。
- **目录与 binary rename 会使旧命令失效** → 将其作为显式 breaking change，同步更新所有 repo-owned docs、scripts、tests 和 lockfile references，并用 repository-wide search 验证无遗留身份。
- **收窄 file exchange 可能误伤 PPTX 或 Worktree target** → 保留现有 exchange binding 与 runtime loader，分别测试 trunk 和 Worktree PPTX，并验证非 `.pptx` 路径失败。
- **删除跨 Unit smoke coverage 可能掩盖保留链路回归** → 用 Slide-only regression 覆盖 create、execute、inspect、lint、screenshot、Worktree lifecycle、Review URL、Web load 和 export，而不是只删除 assertions。

## Migration Plan

1. move example 目录并更新所有 repo-owned identity references；不复制旧路径。
2. 收窄 shared/Server/CLI/Web contracts，再清理只服务被删分支的 imports 与 direct dependencies。
3. 把继承的跨 Unit/import tests 替换为 Slide-only tests，同时保留当前单页 Resource-backed Slide smoke workflow。
4. 更新 skill 与文档，执行 frozen install、format、lint、typecheck、build、tests 和 Web/PPTX acceptance checks。

失败时整体回退此 Change 的目录 move 和同一批 contract edits；旧 application 没有受支持的持久化迁移，因此无需 data rollback。

## Open Questions

无。会改变行为、实现边界或任务拆分的问题已经在 proposal plan 中确认。
