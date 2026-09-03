## ADDED Requirements

### Requirement: Native Enhancement 保持可重放与可交付

application SHALL 允许 Agent 以 SVG visual 表达 chart/table，或以 Authoring Source 中保存的 Native Enhancement 增加 editable native chart/table；普通 shape、text 和 image MUST 继续由对应 page SVG 定义，Native Enhancement MUST 在目标 page 最后一次 SVG replacement 成功提交后执行。

#### Scenario: 使用 SVG 表达 chart 或 table

- **WHEN** Agent 不需要 native editable semantics，并在 page SVG 中以普通 SVG elements 表达 chart 或 table
- **THEN** application SHALL 通过既有 per-page compile/execute workflow 生成该视觉内容
- **AND** SHALL 不要求创建 Native Enhancement

#### Scenario: 在 page replacement 后重放 Native Enhancement

- **WHEN** Agent 修改含有 native chart 或 table 的 page SVG 并重新执行 full-page replacement
- **THEN** replacement SHALL 移除该 page 原有的 native elements
- **AND** Agent workflow MUST 在 replacement commit confirmed 后从维护的 `<task-dir>/enhancements/` source 重放该 page 的 Native Enhancement
- **AND** inspection 与 screenshot MUST 再次证明 native elements 存在且位置正确

#### Scenario: Web Viewer 显示 native chart 与 table

- **WHEN** 用户在 Web Viewer 中打开包含 native chart/table 的 trunk 或 Worktree Slide deck
- **THEN** Viewer MUST 加载并显示这些 native elements 及其 editable semantics
- **AND** trunk/Worktree routing、Ready 状态与适用的 review actions MUST 保持可用

#### Scenario: 导出包含 native chart 与 table 的 PPTX

- **WHEN** Agent 从目标 Worktree 导出包含 native chart/table fixture 的 PPTX
- **THEN** Native chart source MUST 显式设置 category field 与 value fields mapping
- **AND** exporter diagnostics MUST 不包含丢弃预期 native element 的 error
- **AND** exported package MUST 包含 chart XML、embedded workbook 和含有 native table 的 slide XML

## MODIFIED Requirements

### Requirement: 稳定资源进入 Authoring Source

application MUST 把 Presentation Brief 或 deck specification、逐页 SVG、由 Resource Library stable handle 导出的本地视觉资源和可选 Native Enhancements 作为可维护的 deck-level Authoring Source；compiled Facade programs MUST 作为 disposable output。Agent workflow MUST 为每个 deck 使用独立任务目录、允许调用方选择其位置，并把该任务的 Authoring Source、generated programs 与 Review Evidence 保持在该目录下。一个 Resource-backed Slide deck MUST 至少有一页引用 stable-handle asset，但 MUST NOT 要求每页都引用资源。

#### Scenario: Agent 建立 deck-level Authoring Source

- **WHEN** Agent 根据 Presentation Brief 规划一个 Slide deck
- **THEN** Agent MUST 选择一个不与其他 deck job 共用的任务目录，其位置 MAY 由用户或 Agent 决定
- **AND** Authoring Source MUST 在该任务目录下记录 deck 叙事与逐页内容合同，并为每个 page 保留独立 SVG
- **AND** exported stable-handle assets 与可选 Native Enhancements MUST 保留在同一任务目录中
- **AND** compiled programs MUST 写入该任务目录内的 generated output location，而不是作为 Authoring Source

#### Scenario: 用户准备 Baseline Slide 资源

- **WHEN** 用户查询 resource catalog 并把 canonical handle `example-tabler-outline/rocket` 导出到 `<task-dir>/resources/`
- **THEN** export result SHALL 标识同一 stable handle
- **AND** Baseline Deck 中至少一个 page SVG 对 `example-tabler-outline--rocket.svg` 的本地引用可以被 compiler 解析
- **AND** Baseline Deck 的其他 pages MAY 不引用 Resource Library asset

#### Scenario: Authoring Source 缺少导出资源

- **WHEN** 用户编译引用 `example-tabler-outline--rocket.svg` 的 page，而该资源尚未导出
- **THEN** compile command MUST 失败并指出缺失的相对 asset
- **AND** 不得生成可执行的成功结果

### Requirement: 两步编译与 Worktree 应用

application SHALL 对每个 page 使用标准两步边界：`compile-svg --page <number>` 生成 disposable Facade program，既有 `execute --file` command 再把该 program 应用到指定 Slide Worktree。application MUST 不设置人工页数上限；首次生成 MUST 从 page 1 连续递增，已有 page MUST 被 replace，仅 `pageCount + 1` MUST append，跳过 page number MUST 失败。

#### Scenario: Baseline Slide 成功写入 Worktree

- **WHEN** 用户以 replace mode 编译 Baseline Deck 的 page 1 SVG，并通过 `execute --file` 对 Slide Worktree 执行该 program
- **THEN** compiler result SHALL 报告 960 × 540 viewport、page 1 和 deterministic text measurement
- **AND** execution result MUST 报告 `commit: "confirmed"`
- **AND** Worktree page 1 SHALL 包含由 Authoring Source 生成的 elements

#### Scenario: Baseline Deck 按顺序写入 Worktree

- **WHEN** 用户从 page 1 开始按连续递增 page number 以 replace mode 编译 Baseline Deck 的全部 page SVG，并依次执行 generated programs
- **THEN** 每次 compiler result SHALL 报告对应 1-based page number、SVG viewport 和 text measurement diagnostics
- **AND** 每次 execution result MUST 报告 `commit: "confirmed"`
- **AND** Worktree SHALL 按 Authoring Source 的顺序包含全部 pages

#### Scenario: 替换已有 page

- **WHEN** Agent 对 `1 <= page <= pageCount` 的目标 page 重新执行 replace program
- **THEN** application MUST 清除并重建该目标 page 的既有 elements
- **AND** 其他 pages MUST 保持不变

#### Scenario: 追加下一个 page

- **WHEN** Agent 对 `page = pageCount + 1` 执行首次生成的 page program
- **THEN** application MUST append 恰好一个 page
- **AND** 新 page MUST 位于原有最后一页之后

#### Scenario: 拒绝跳过 page number

- **WHEN** Agent 对 `page > pageCount + 1` 执行 page program
- **THEN** execution MUST 失败并报告 page out-of-range
- **AND** application MUST NOT 静默创建中间空白 pages

#### Scenario: Worktree commit 未确认

- **WHEN** 任一 page program 或 Native Enhancement 的 execution result 的 commit status 不是 `confirmed`
- **THEN** Agent workflow MUST 停止后续 page generation 或 Ready handoff
- **AND** MUST 向用户返回该 commit result

### Requirement: Baseline Deck 具有精简的多页视觉合同

application SHALL 提交至少两页、每页 960 × 540 的 Baseline Deck Authoring Source，并在 deck 中保留“产品发布状态”的深色视觉、标题与副标题、等宽状态卡、横向流程和 canonical rocket resource；Baseline Deck MUST 保持精简，native chart/table MUST 由独立最小 fixture 验证。

#### Scenario: Baseline Slide 结构可检查

- **WHEN** 用户检查已提交的 page 1
- **THEN** structured inspection SHALL 显示与既有产品发布状态视觉合同对应的 text、shape、image、transform 和 stacking facts
- **AND** page SHALL 保持 960 × 540 尺寸

#### Scenario: Baseline Deck 结构可检查

- **WHEN** 用户检查完整 Baseline Deck
- **THEN** structured inspection SHALL 显示至少两个连续 pages，以及与逐页视觉合同对应的 text、shape、image、transform 和 stacking facts
- **AND** 每个 page SHALL 保持 960 × 540 尺寸和一致的字体、颜色与资源风格

#### Scenario: Baseline Deck 不承担 native fixture

- **WHEN** automated verification 覆盖 editable native chart/table authoring
- **THEN** verification MUST 使用独立的最小 native fixture
- **AND** Baseline Deck MUST NOT 因该可选路径而被要求包含 native chart 或 table

### Requirement: Review Evidence 控制交付

Agent workflow MUST 在 Ready handoff 前为每个 page 联合检查 compiler diagnostics、structured inspection、layout findings 和 rendered screenshot，并完成 deck-level consistency assessment；通过后 SHALL 返回同一 Worktree 的 Review URL，并仅在用户请求时导出该 Worktree 的 PPTX。

#### Scenario: 页面满足交付门槛

- **WHEN** 每个 page 的 compiler warnings 为零、除 deterministic estimation 外没有未解释的 compiler lint、layout findings 为零、page screenshot review 通过，且跨页叙事、字体、颜色、资源风格与尺寸一致性 review 通过
- **THEN** Agent SHALL 把 Worktree 标记为 Ready
- **AND** SHALL 返回 Unit ID、Worktree ID、confirmed revision、deck-level Authoring Source、resources、Native Enhancements（若有）、逐页 screenshots、deck consistency assessment 和 Review URL
- **AND** Review URL MUST 只承诺在 application 内置 Web Server 运行期间可用

#### Scenario: 用户请求 Worktree PPTX

- **WHEN** deck 通过 Review Evidence 且用户请求 PPTX 文件
- **THEN** Agent SHALL 从同一个 Ready Worktree revision 导出 `.pptx`
- **AND** exported deck MUST 包含预期 pages 和已验收的 native elements（若有）

#### Scenario: 页面仍有视觉缺陷

- **WHEN** warning、未解释 compiler lint、layout finding、page screenshot review 或 deck-level consistency assessment 发现缺陷
- **THEN** Agent MUST 修改受影响的 page SVG 或 Native Enhancement，并重新执行该 page 的 replacement、必要的 enhancement replay 和 Review Evidence 检查
- **AND** MUST NOT 使用 add mode 覆盖旧的错误 elements 或在缺陷存在时标记 Ready

### Requirement: 专用 Agent skill 约束 deck authoring

application SHALL 安装可自动发现的 `univer-slide-authoring` skill，指导 Agent 把 Presentation Brief 转成 deck specification，并在 `slide-gen-cli` 中完成资源选择、逐页 SVG authoring、连续首次生成、局部修订、可选 Native Enhancement、Review Evidence 和 Worktree handoff。

skill SHALL 以 `<task-dir>` layout 作为示例，引导 Agent 把一个 deck job 的输入与产物建立在同一任务目录下，但 MUST NOT 规定该目录的文件系统位置。

#### Scenario: Agent 接收单页 Slide 请求

- **WHEN** 用户请求创建或重新设计 Resource-backed Slide deck 中的一页
- **THEN** skill SHALL 引导 Agent 保留该 page 的 Authoring Source、使用 Resource Library 和 SVG compiler，并收集该 page 的 Review Evidence
- **AND** skill SHALL 允许只替换已有 page，而不要求重建其他 pages

#### Scenario: Agent 接收多页 Slide deck 请求

- **WHEN** 用户请求创建或重新设计一个 Resource-backed Slide deck
- **THEN** skill SHALL 引导 Agent 保留完整 Authoring Source、使用 Resource Library 和 SVG compiler，并从 page 1 开始连续生成用户 brief 所需的全部 pages
- **AND** skill MUST NOT 设置人工页数上限
- **AND** skill SHALL 引导 Agent 逐页收集 evidence、完成 deck consistency review，并交付 Ready Review URL 与用户请求的 PPTX

#### Scenario: Agent 选择 chart 或 table 表达

- **WHEN** Presentation Brief 要求 chart 或 table
- **THEN** skill SHALL 允许 Agent 使用 SVG visual，或在需要 editable native semantics 时保存并执行 Native Enhancement
- **AND** skill MUST 指导 Agent 在目标 page 最后一次 replacement 后重放 enhancement，并验证 inspection、screenshot 与 export result
- **AND** skill SHALL 排除 Office import、template system，以及用手写 Facade drawing code authoring 普通 shape、text 或 image

### Requirement: 验证不依赖远程资源可用性

automated verification MUST 使用固定 manifest 与 fake downloader 物化 canonical resource，并覆盖 stable application identity、Slide-only create/export/Web surface、resource export、逐页 compile、Worktree commits、inspection、layout lint、PNG screenshots、deck review 和 skill installation，而不访问远程 asset host；native chart/table MUST 使用独立最小 fixture 验证。

#### Scenario: 离线 smoke path

- **WHEN** smoke test 在没有远程 asset host 的环境中运行
- **THEN** fake resource source SHALL 生成与 canonical export filename 相同的本地 SVG
- **AND** 至少两页的完整 Baseline Deck workflow SHALL 通过

#### Scenario: Slide-only regression path

- **WHEN** regression tests 运行 application 的 CLI、Server 与 Web contracts
- **THEN** tests MUST 证明 `slide-gen-cli` identity、无 type 的 Slide create、缺失的 `import` 和不可用的 Sheet/Doc paths
- **AND** tests MUST 证明 trunk/Worktree PPTX export、Worktree lifecycle、Review URL 与保留的 authoring/inspection commands 可用

#### Scenario: Page transition regression path

- **WHEN** automated tests 对 Slide Worktree 执行 per-page generated programs
- **THEN** tests MUST 分别证明 existing-page replace、`pageCount + 1` append 和 skipped-page rejection
- **AND** tests MUST 不依赖新的 deck compiler、orchestrator 或 custom apply adapter

#### Scenario: Native fixture regression path

- **WHEN** 独立 native fixture 被执行和导出
- **THEN** tests MUST 证明 native chart/table 可被 inspect、render、layout lint、screenshot 和 Web Viewer 处理
- **AND** tests MUST 验证 chart category/value mapping、exporter diagnostics、chart XML、embedded workbook 与 table slide XML，而不只检查 ZIP signature

## RENAMED Requirements

- FROM: `### Requirement: Baseline Slide 具有固定视觉合同`
- TO: `### Requirement: Baseline Deck 具有精简的多页视觉合同`
- FROM: `### Requirement: 专用 Agent skill 约束单页 authoring`
- TO: `### Requirement: 专用 Agent skill 约束 deck authoring`
