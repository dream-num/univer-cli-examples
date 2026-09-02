## Context

本 Change 新增一个独立 example，并复用 `04-worktree` 已验证的 collaboration/runtime/render/Web review 链。新增行为跨越 CLI composition、外部资源 manifest、SVG compile、Worktree execution、visual verification、Agent skill 和 smoke test，因此需要 design 约束边界。版本与 API 事实来自两份 dated research notes；领域词汇来自 [`CONTEXT.md`](../../../CONTEXT.md)。

## Goals / Non-Goals

**Goals:**

- 用 SDK 标准 commands 组成 Resource Library → SVG compile → Worktree execution → Review Evidence 的单页 authoring workflow。
- 保留 `04-worktree` 的完整命令面，只让 README 与 skill 聚焦 Resource-backed Slide。
- 提供确定的 Baseline Slide 和离线可重复的 smoke path。
- 让 Agent 的可编辑资产停留在 Authoring Source，generated Facade program 只作为运行产物。

**Non-Goals:**

- 不增加一体化 `--apply` adapter、browser-backed text measurer 或新的 runtime abstraction。
- 不扩展为多页 deck、chart、table、PPTX export、自动 asset selection 或 template system。
- 不修改 `01`–`04` 的依赖、命令或测试。

## Diagram design (Optional)

```text
trusted manifest → resources find/export → authoring/resources/example-tabler-outline--rocket.svg
                                              ↓
authoring/page.svg → compile-svg --out → generated Facade program
                                              ↓
Slide Worktree ← execute --file ←─────────────┘
      ↓
inspect + layout lint + screenshot → Ready review URL
```

## Decisions

### 1. 复制 04 的 standalone example，保持其行为不变

`06-resource-backed-slide` 从 `04-worktree` 建立独立目录并保留全部既有 commands、server、Viewer、render page 和 tests。新增概念只进入 composition root、authoring assets、skill 和文档。替代方案是裁成 Slide-only application，但会扩大删除与回归范围，并破坏仓库现有的递进式 standalone example 形态。

### 2. 保持公开 beta.2 cohort

新增 `@univer-cli/resource-library`、`@univer-cli/resource-library-command`、`@univer-cli/svg-facade` 和 `@univer-cli/svg-facade-command` 的 exact `1.0.0-beta.2`，以及独立的 `@univerjs-pro/cli-assets@0.1.0`。不使用 registry 中不存在的 insiders 版本。SVG command 按 beta.2 surface 传入 `builtinTextMeasurer`。

### 3. 标准两步 command，不新增 apply adapter

composition root 直接添加标准 `resources` 与 `compile-svg` commands。compiler 只生成 page-bound Facade program；既有 `execute --file` 继续持有 Unit binding、runtime、mutation capture 和 commit。这样新增代码只负责装配，不复制参考 application 的 target policy。

### 4. Application 持有 Resource Library policy，并暴露一个测试接缝

默认 program 通过发布 package 的 manifest、`.data/resources` absolute cache root 和 Node adapters 打开 Resource Library。`createProgram()` 接受可选的 `openResourceLibrary` factory，仅供 tests 注入 fixed manifest/fake downloader；command behavior 不因注入方式改变。替代方案是环境变量或本地 HTTPS test server，都会增加无教学价值的配置与基础设施。

### 5. Baseline Slide 固定资源与安全 SVG 子集

Baseline Slide 使用 canonical handle `example-tabler-outline/rocket`，Authoring Source 引用 `authoring/resources/example-tabler-outline--rocket.svg`。仓库提交 `authoring/page.svg`，忽略导出的 resources、`.generated/` program 和 `output/` screenshots。页面只使用 compiler 已覆盖的普通 shape、path、text、linear gradient、image 和 group；不使用 filter、mask、translucent gradient 或非方形 radial gradient。

### 6. Estimator 是明确取舍，Review Evidence 是交付门槛

compile 命令显式使用 `--estimate-text-size`；预期的 estimation compiler lint 可以保留，其他 compiler lint 必须解释或修正，warnings 必须为零。layout lint 必须无 finding，最终 screenshot 由实现 QA 人工检查对齐、层级、对比度和内容完整性。只有 Baseline Slide 无法达到这些门槛时才重新打开 browser measurer 决策。

### 7. 专用 skill 替换继承的通用 skill

`skills/univer-slide-authoring/SKILL.md` 与 install/uninstall symlink 只服务单页 SVG authoring。skill 不复制参考 Slide skill 的多页、chart、table、transition 或 existing-element editing 章节，并禁止用 add mode 修补 replace workflow。

## Risks / Trade-offs

- **真实 resource export 依赖网络和 manifest host** → README 固定 handle 与 exact manifest package；automated verification 使用 fake downloader，不把外部可用性变成 CI 条件。
- **Estimator 可能造成文字盒偏差** → Baseline 使用短文案和宽裕布局，并强制 layout lint 与 screenshot review。
- **复制 04 带来较多继承文件** → 不改继承模块；新增行为集中在少量 composition、authoring、skill、test 和 docs 文件。
- **Compiler warnings 不自动失败 command** → skill 与 smoke test 解析 JSON 并显式断言 warnings；commit status 同样显式检查。
- **动态 Agent 重写难以稳定自动测试** → smoke test 只验证 committed Baseline Slide；skill workflow 通过 install/read 与行为边界验收。

## Migration Plan

这是新增独立 example，不迁移用户数据或既有 example。失败时可移除 `examples/06-resource-backed-slide` 和根索引条目；`01`–`04` 不受影响。

## Open Questions

无。影响行为、实现方式或任务拆分的问题已在 planning session 中确认。
