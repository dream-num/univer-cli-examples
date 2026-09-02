## ADDED Requirements

### Requirement: 稳定的 slide-gen-cli application identity

application MUST 在目录、package、binary、Web 页面标题、Agent skill 命令示例和仓库索引中使用 `slide-gen-cli` 身份，并且仓库索引 SHALL 把它列为独立 Agent application，而不是编号教学序列的一部分。

#### Scenario: 用户定位并启动 application

- **WHEN** 用户从仓库索引进入 `examples/slide-gen-cli/` 并安装该 package
- **THEN** package name SHALL 为 `@univer-cli-example/slide-gen-cli`
- **AND** 用户 SHALL 通过 `slide-gen-cli` binary 运行 commands
- **AND** Web 页面与文档 SHALL 使用 `Slide Gen CLI` 标题

### Requirement: Slide-only direct dependency boundary

`slide-gen-cli` package MUST 移除只服务 Sheet 或 Doc application presets 的 direct dependencies，同时 MUST 保留 Slide editor/rendering 所需的 Docs/Drawing dependency closure 和 PPTX exchange dependencies。

#### Scenario: 安装 Slide-only application

- **WHEN** 用户依据 committed lockfile 安装 `slide-gen-cli`
- **THEN** package manifest MUST NOT direct-depend on `@univerjs/preset-sheets-core` 或 `@univerjs/preset-docs-core`
- **AND** Slide editor、render page、screenshot 和 `.pptx` export 所需依赖 MUST 仍可解析

## MODIFIED Requirements

### Requirement: 保留前置 example 的命令面

`slide-gen-cli` SHALL 保留 `04-worktree` 已提供的 Slide Unit、Worktree、inspection、execution、API reference、screenshot、layout lint 和 Web review 行为，以及 Resource Library 与 SVG compiler authoring commands；application 的 Unit lifecycle MUST 只接受 Slide，file exchange MUST 只保留 PPTX export。

#### Scenario: 既有命令仍可使用

- **WHEN** 用户在 `slide-gen-cli` 中构建 application 并查看 CLI help
- **THEN** `create`、`export`、`worktree`、`inspect`、`execute`、`open`、`api`、`screenshot`、`lint`、`resources` 与 `compile-svg` commands 仍可发现并执行
- **AND** Worktree Ready、Reopen、Merge 与 Discard lifecycle 仍可用

#### Scenario: CLI 与 Server 创建 Slide Unit

- **WHEN** 用户执行 `slide-gen-cli create --name <name>`
- **THEN** command MUST 不要求 Unit type 参数
- **AND** Server MUST 创建具有该名称的空 Slide Unit

#### Scenario: 不支持跨 Unit 创建和 Office import

- **WHEN** 用户查看 top-level 与 `create` command help、调用 Unit create API 或使用 Web create action
- **THEN** top-level `import` command、create Unit type 参数和 Web Unit type selector MUST 不可用
- **AND** legacy type 或 imported data input MUST NOT 使 application 创建、导入或加载 Sheet 或 Doc Unit

#### Scenario: 从 trunk 导出 PPTX

- **WHEN** 用户执行 `slide-gen-cli export <file.pptx> --unit <id> --trunk`
- **THEN** application MUST 把目标 Slide Unit 的 trunk revision 导出为 PPTX
- **AND** 非 `.pptx` 输出路径 MUST 失败并指出允许的 extension

#### Scenario: 从 Worktree 导出 PPTX

- **WHEN** 用户执行 `slide-gen-cli export <file.pptx> --unit <id> --worktree <worktree-id>`
- **THEN** application MUST 从指定 Worktree revision 导出 PPTX
- **AND** export MUST NOT 隐式改用 trunk revision

#### Scenario: Web Viewer 保持 Worktree review

- **WHEN** 用户打开 trunk 或包含 `unit` 与 `worktree` query 的 Review URL
- **THEN** Web app MUST 只加载目标 Slide Unit
- **AND** trunk/Worktree routing、draft/ready 状态和适用的 review actions MUST 保持可用

### Requirement: 专用 Agent skill 约束单页 authoring

application SHALL 安装可自动发现的 `univer-slide-authoring` skill，指导 Agent 在 `slide-gen-cli` 中完成单页资源选择、SVG authoring、两步执行、视觉修正和 Worktree handoff。

#### Scenario: Agent 接收单页 Slide 请求

- **WHEN** 用户在 `slide-gen-cli` 中请求创建或重设计一页 Resource-backed Slide
- **THEN** skill SHALL 引导 Agent 保留 Authoring Source、使用 Resource Library 和 SVG compiler，并收集 Review Evidence
- **AND** SHALL 排除手写 Facade drawing code、多页、chart、table 和 template system

### Requirement: 验证不依赖远程资源可用性

automated verification MUST 使用固定 manifest 与 fake downloader 物化 canonical resource，并覆盖 stable application identity、Slide-only create/export/Web surface、resource export、compile、Worktree commit、inspection、layout lint、PNG screenshot 和 skill installation，而不访问远程 asset host。

#### Scenario: 离线 smoke path

- **WHEN** smoke test 在没有远程 asset host 的环境中运行
- **THEN** fake resource source SHALL 生成与 canonical export filename 相同的本地 SVG
- **AND** 完整单页迁移 baseline workflow SHALL 通过

#### Scenario: Slide-only regression path

- **WHEN** regression tests 运行 application 的 CLI、Server 与 Web contracts
- **THEN** tests MUST 证明 `slide-gen-cli` identity、无 type 的 Slide create、缺失的 `import` 和不可用的 Sheet/Doc paths
- **AND** tests MUST 证明 trunk/Worktree PPTX export、Worktree lifecycle、Review URL 与保留的 authoring/inspection commands 可用
