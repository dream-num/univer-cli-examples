## Purpose

定义一个可复制的单页 Resource-backed Slide 教学闭环，使用户和 Agent 能从稳定视觉资源开始，经 SVG 编译与 Worktree 提交，交付具有完整 Review Evidence 的 Univer Slide。

## ADDED Requirements

### Requirement: 保留前置 example 的命令面

`06-resource-backed-slide` SHALL 保留 `04-worktree` 已提供的 Unit、file exchange、Worktree、inspection、execution、API reference、screenshot、layout lint 和 Web review 行为，同时增加本 capability 的 authoring commands。

#### Scenario: 既有命令仍可使用

- **WHEN** 用户在 `06-resource-backed-slide` 中构建并启动 example
- **THEN** `04-worktree` 的既有 commands 仍可发现并执行
- **AND** `resources` 与 `compile-svg` commands 同时可用

### Requirement: 稳定资源进入 Authoring Source

example MUST 通过 Resource Library stable handle 提供资源查找与导出，并且 Baseline Slide MUST 引用由 `example-tabler-outline/rocket` 导出的 `example-tabler-outline--rocket.svg`。

#### Scenario: 用户准备 Baseline Slide 资源

- **WHEN** 用户查询 resource catalog 并把 canonical handle `example-tabler-outline/rocket` 导出到 `authoring/resources/`
- **THEN** export result 标识同一 stable handle
- **AND** `authoring/page.svg` 的本地资源引用可以被 compiler 解析

#### Scenario: Authoring Source 缺少导出资源

- **WHEN** 用户在缺少 `example-tabler-outline--rocket.svg` 时编译 Baseline Slide
- **THEN** compile command MUST 失败并指出缺失的相对 asset
- **AND** 不得生成可执行的成功结果

### Requirement: 两步编译与 Worktree 应用

example SHALL 使用标准两步边界：compile command 把 page 1 的 SVG 生成 disposable Facade program，既有 execution command 再把该 program 应用到指定 Slide Unit 的 Worktree。

#### Scenario: Baseline Slide 成功写入 Worktree

- **WHEN** 用户以 replace mode 编译 `authoring/page.svg` 到 generated program，并通过 `execute --file` 对 Slide Worktree 执行该 program
- **THEN** compiler result SHALL 报告 960 × 540 viewport、page 1 和 deterministic text measurement
- **AND** execution result MUST 报告 `commit: "confirmed"`
- **AND** Worktree page 1 SHALL 包含由 Authoring Source 生成的元素

#### Scenario: Worktree commit 未确认

- **WHEN** execution result 的 commit status 不是 `confirmed`
- **THEN** Agent workflow MUST 停止后续 Ready handoff
- **AND** MUST 向用户返回该 commit result

### Requirement: Baseline Slide 具有固定视觉合同

example SHALL 提交一张 960 × 540 的“产品发布状态”Baseline Slide Authoring Source，包含深色背景、标题与副标题、三个等宽状态卡、横向流程线，以及从 canonical handle 导出的 rocket resource。

#### Scenario: Baseline Slide 结构可检查

- **WHEN** 用户检查已提交的 page 1
- **THEN** structured inspection SHALL 显示与视觉合同对应的文本、shape、image、transform 和 stacking facts
- **AND** page SHALL 保持单页 960 × 540 尺寸

### Requirement: Review Evidence 控制交付

Agent workflow MUST 在 Ready handoff 前联合使用 compiler diagnostics、structured inspection、layout findings 和 rendered screenshot 验证 Slide。

#### Scenario: 页面满足交付门槛

- **WHEN** compiler warnings 为零、除 deterministic estimation 外没有未解释的 compiler lint、layout findings 为零，并且 screenshot review 通过
- **THEN** Agent SHALL 把 Worktree 标记为 Ready
- **AND** SHALL 返回 Unit ID、Worktree ID、confirmed revision、Authoring Source、resource、screenshot 和 review URL

#### Scenario: 页面仍有视觉缺陷

- **WHEN** warning、未解释 compiler lint、layout finding 或 screenshot review 发现缺陷
- **THEN** Agent MUST 修改 `authoring/page.svg` 并重新执行 replace compile、commit 和 Review Evidence 检查
- **AND** MUST NOT 使用 add mode 覆盖旧的错误元素

### Requirement: 专用 Agent skill 约束单页 authoring

example SHALL 安装可自动发现的 `univer-slide-authoring` skill，指导 Agent 完成单页资源选择、SVG authoring、两步执行、视觉修正和 Worktree handoff。

#### Scenario: Agent 接收单页 Slide 请求

- **WHEN** 用户在 `06-resource-backed-slide` 中请求创建或重设计一页 Resource-backed Slide
- **THEN** skill SHALL 引导 Agent 保留 Authoring Source、使用 Resource Library 和 SVG compiler，并收集 Review Evidence
- **AND** SHALL 排除手写 Facade drawing code、多页、chart、table 和 template system

### Requirement: 验证不依赖远程资源可用性

automated verification MUST 使用固定 manifest 与 fake downloader 物化 canonical resource，并覆盖 resource export、compile、Worktree commit、inspection、layout lint、PNG screenshot 和 skill installation，而不访问远程 asset host。

#### Scenario: 离线 smoke path

- **WHEN** smoke test 在没有远程 asset host 的环境中运行
- **THEN** fake resource source SHALL 生成与 canonical export filename 相同的本地 SVG
- **AND** 完整 Baseline Slide workflow SHALL 通过

