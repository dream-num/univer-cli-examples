# Slide Gen CLI 的产品故事与 Scope

- 调研日期：2026-09-02
- 调研对象：当前 `examples/06-resource-backed-slide`
- 目标身份：`examples/slide-gen-cli`
- 问题：如何把当前 example 收敛成一个面向 Agent 的 Slide deck 生成器，同时保留 Worktree 审阅、PPTX export 与在线查看？
- 依据：当前实现、`04-worktree`、本地 Univer CLI/SDK 源码、`CONTEXT.md`、未归档 Change `add-resource-backed-slide-example`

## 结论

本 example 应定位为一个可复制的 Agent application，而不是编号教程的下一课。用户给 Agent 一段 presentation brief；Agent 使用专用 skill、API reference、Resource Library 和 SVG compiler 生成一组 Slide pages，在 Worktree 中迭代，通过 inspection、layout lint 和 screenshot 自检，最后把 Worktree 标记为 Ready，并返回 Web Viewer URL 和可选的 PPTX 文件。

不设置单页限制。Authoring workflow 按 page 独立保存 SVG、按顺序编译和应用，并在 deck 级别做最终一致性检查。Chart 和 table 是允许的内容；需要原生可编辑语义时，可以在 SVG 页面布局完成后通过 Slide Facade 插入。Export 保留并收敛为 Slide → PPTX；import 不进入本 application。

Worktree、API reference、inspection、screenshot、layout lint、render page、PPTX export 和 Web Viewer 都服务这个 Agent 闭环，应当保留。需要删除的是 Sheet、Doc、Office import 以及由多 Unit 类型带来的分支。

本文中的“在线查看”指 `slide-gen-cli` 自带 Web Server 提供的浏览器 Viewer。它在 Server 运行期间返回可访问 URL；本 scope 不增加公网部署、托管、认证或永久分享链接。

```text
用户 presentation brief
  → Agent 读取 univer-slide-authoring skill
  → 规划 deck 与逐页内容
  → api/resources 查询能力和素材
  → authoring/pages/page-NN.svg
  → 按页 compile-svg
  → execute 到 Slide Worktree
  → 可选 native chart/table enhancement
  → inspect + lint + screenshot
  → 修订对应 page source 并重复生成
  → deck review + Worktree Ready
  → Web Viewer URL + 可选 PPTX export
```

## 产品故事

用户不需要先理解 Facade API、SVG compiler 或 Worktree。用户只描述要生成的 deck，例如：

```text
生成一份六页的产品发布汇报。使用深色 16:9 视觉，包含封面、目标用户、
发布计划、指标图表、风险对照表和下一步。突出 9 月 15 日发布日期，
使用统一风格的 rocket 资源。完成检查后给我在线审阅地址和 PPTX。
```

Agent 在 `slide-gen-cli` 目录中完成以下工作：

1. 把 brief 转成 deck-level spec，确定页数、叙事顺序、每页核心信息、文案、布局、配色和资源语义。
2. 创建 Slide Unit 和隔离的 Worktree。
3. 必要时用 `api find/show --unit slide` 查阅 Facade 能力，用 `resources find/export` 选择并物化资源。
4. 为每页保存独立 SVG，用 `compile-svg --page N` 生成 disposable Facade program，并按页码顺序提交到同一 Worktree。
5. 需要原生 chart/table 时，在对应页面的完整 SVG replacement 结束后执行该页的 enhancement program。
6. 每页联合使用 structured inspection、layout lint 和 screenshot 检查内容与视觉结果；发现问题时修改该页 source，再执行 replacement 和 enhancement。
7. 全部页面完成后检查跨页字体、颜色、资源风格、页尺寸和叙事一致性。
8. 验收通过后将 Worktree 标记为 Ready，返回在线 Viewer URL；用户要求文件时，从同一 Worktree 导出 PPTX。

Baseline artifact 仍提供确定性的教学与 smoke target。用户 brief 驱动的页数和内容可以变化，但每次都遵守同一条 per-page authoring 和 deck review pipeline。

## 多页能力的本地证据

`@univer-cli/svg-facade` 的 `wrapSlideScript()` 已定义 1-based page 语义：

- 目标页已经存在：replace mode 清空该页元素后重新生成；
- `page = 当前页数 + 1`：调用 `presentation.appendSlide()` 追加一页；
- `page > 当前页数 + 1`：执行时报 out-of-range，不会静默创建中间空页。

因此多页 deck 不需要新的 compiler adapter，但必须从 page 1 开始按升序首次生成。后续修改可以只重新编译和替换任意已存在页面。

建议的 Authoring Source 结构：

```text
authoring/
  deck.md
  pages/
    page-01-cover.svg
    page-02-audience.svg
    page-03-plan.svg
    page-04-metrics.svg
  enhancements/
    page-04-chart.js       # 仅在需要原生可编辑 chart/table 时存在
  resources/
    <registry>--<resource>.svg
.generated/
  page-01.js
  page-02.js
  page-03.js
  page-04.js
```

`deck.md`、page SVG、resource files 和显式 authoring enhancements 是可维护 source；`.generated/` 中的 compiler output 仍是 disposable build output。

## Chart 与 table

Chart 和 table 不应被 skill 排除。Agent 可以根据交付要求选择两种表达：

1. **SVG visual**：用 shape、line、text 等组成 chart/table。它遵循同一 compile pipeline，适合静态展示。
2. **Native Slide element**：先在 page SVG 中预留区域，完成该页最后一次 full-page replacement，再通过 API reference 查询 `FSlide` chart/table APIs，并用 `execute` 插入原生可编辑 chart 或 table。

原生 enhancement 必须保存在 `authoring/enhancements/page-NN-*.js`，不能成为一次性终端片段。Full-page SVG replacement 会删除该页所有现有元素，包括已插入的原生 chart/table；修改 SVG 后必须重新执行对应 enhancement。Agent 在 inspection、screenshot 和 PPTX export 后都要验证原生元素仍存在且位置正确。

当前 headless 与 render-page runtimes 已注册 Slide chart/table，inspection、lint 和 screenshot 可以处理这些元素；当前 Web Viewer 只注册基础 Slides plugins。在线查看原生元素时，application 还需要注册 `slides-chart`、`slides-chart-ui`、`slides-table` 和 `slides-table-ui` plugins、styles 与 locales。

Native chart 的 PPTX export 还有一个必须固化的约束：只设置 chart source 会让 exporter 报告无效 static mapping，并在仍返回 PPTX 文件的同时丢弃 chart。Native Enhancement 必须显式设置 category field 与 value fields；验收必须检查 exporter diagnostics，以及 PPTX 内的 chart XML 和 embedded workbook，不能只检查文件的 ZIP signature。Native table 可以直接进入 slide XML。

这个例外不开放任意手写 Facade drawing workflow。普通 shape、text、image 和 layout 继续以 page SVG 为 source；Facade enhancement 只用于 SVG compiler 无法表达的原生语义或已有内容操作。

## Feature 取舍

| Feature | 决定 | 在 Agent 故事中的职责 |
|---|---|---|
| `api find/show` | 保留 | Agent 查询 Slide Facade，诊断执行问题，并实现原生 chart/table enhancement。 |
| `resources find/export` | 保留 | Agent 按语义选择视觉素材，通过 stable handle 物化本地资源。 |
| `compile-svg` | 保留 | 把每页可编辑 SVG 编译成目标页的 Facade program。 |
| `create` | 保留并改成 Slide-only | 创建 deck Unit；删除 `<type>`。 |
| `worktree` | 保留 | 隔离 Agent 的生成与修订，并提供 Ready、Reopen、Merge、Discard 审阅状态。 |
| `execute` | 保留 | 提交 compiler output 和显式 native enhancement 到 Worktree。 |
| `inspect` | 保留 | Agent 验证每页文字、元素、资源、chart/table 和 transform。 |
| `lint` | 保留 | Agent 发现每页重叠、越界等布局问题。 |
| `screenshot` 与 render page | 保留 | Agent 读取渲染结果，并做逐页和跨页视觉检查。 |
| `export` | 保留并改成 PPTX-only | 从 trunk 或 Worktree 导出 `.pptx`；不暴露 XLSX/DOCX 分支。 |
| `import` | 移除 | application 从 brief 生成新 deck，不接收既有 Office 文件。 |
| Web Server/Viewer | 保留 | 用户通过 Worktree URL 在线查看并执行 review actions。 |
| `open` | 保留 | 输出或打开 trunk/Worktree Viewer URL。 |
| Sheet、Doc | 移除 | 生成器只创建、执行、渲染和导出 Slide Unit。 |

API reference、inspection 和 screenshot 的底层 command preset 可能仍显示 Sheet/Doc 选项。本 application 的支持边界固定为 Slide；不为隐藏通用 preset 的少量 help surface 编写自定义 command fork。

## 为什么保留 Worktree

Worktree 在这个产品故事中承担三项明确职责：

- Agent 的多页生成与多轮修订不会直接污染 trunk。
- Agent 可以把同一个隔离结果从 draft 转成 Ready，形成清晰的人机交接点。
- Web Viewer 可以显示 Worktree 结果，并让用户执行 Reopen、Merge 或 Discard。

删除 Worktree 会把“Agent 生成后交给用户在线审阅”退化为直接修改共享内容。该行为不符合当前目标。

## 为什么保留 API reference 与 Review Evidence

API reference 是面向 Agent 的运行时知识入口。Agent 在诊断执行错误、理解 Slide 能力、处理已有内容以及插入 native chart/table 时需要 `api find/show`。

`inspect + lint + screenshot` 分别回答三个不同问题：

- inspection：deck 中实际生成了什么结构和内容；
- layout lint：页面是否存在可机器识别的越界或碰撞；
- screenshot：最终 Univer render 是否符合逐页设计与跨页视觉合同。

Web Viewer 服务用户在线查看，screenshot 服务 Agent 自动读取与迭代，两者不能互相替代。因此 `src/render-page/`、`vite.render.config.ts` 和相关 SDK packages 均保留。

## Slide-only 收敛范围

### CLI

- `program.ts` 保留 `create`、`export`、`worktree`、`inspect`、`execute`、`open`、`api`、`screenshot`、`lint`、`resources` 和 `compile-svg`。
- 删除 `import` command；把 `features/file.ts` 收敛或改名为 PPTX-only export feature。
- `create` 改成 `create --name <name>`，固定创建 Slide。
- `export <file.pptx>` 保留 `--trunk`/`--worktree` target，只接受 `.pptx`。
- `execute`、`inspect`、`screenshot`、`lint` 继续接受 Worktree target；支持整个 Slide deck。
- `api` 在 README 和 skill 中固定使用 `--unit slide`。
- `shared/unit.ts` 收敛为 Slide constant/type mapping，不再暴露 Sheet/Doc choices。

### Server

- `/api/units` 只创建空 Slide snapshot，不再解析 Unit type 或 imported data。
- 删除 `createWorkbook()`、`createDocument()` 和 `importedUnitInput()`。
- 保留 collaboration database、Worktree database、endpoint、service、UnitStore 与 WorktreeStore。
- 保留 `/api/worktrees` 与 trunk/Worktree collaboration transports。

### Web

- 删除 Sheet/Doc presets、locale、类型选择和对应 `loadSheetAsync`/`loadDocAsync` 分支。
- 注册 Slide chart/table Web plugins、styles 与 locales，使 Native Enhancement 在 Viewer 中可见并可编辑。
- “New” 固定创建 Slide；Unit 列表可保留，类型标签固定为 Slide 或直接省略。
- 保留 Worktree 列表、draft/ready 状态、review actions、Slide canvas 与连接状态。
- Viewer 同时支持 trunk 与 `?unit=<id>&worktree=<id>`，可浏览 deck 中全部 pages。

Slides 自身依赖 `@univerjs/docs`、`@univerjs/docs-ui`、`@univerjs/drawing*` 等 plugins。它们属于 Slide editor/rendering 的依赖闭包，不能按 package 名称误判为 Doc feature。

## 名称与目录

编号 `06` 暗示它只是 `01`–`04` 递进教程的下一步，也掩盖了它已经具备 Agent skill、生成、隔离审阅、PPTX export 和在线交付的 application 形态。统一改为：

```text
目录       examples/slide-gen-cli/
package    @univer-cli-example/slide-gen-cli
binary     slide-gen-cli
标题       Slide Gen CLI
skill      univer-slide-authoring
```

skill 名称保留 `univer-slide-authoring`，因为它描述 Agent 何时应触发该 workflow；skill 的 description 和正文改为指向 `slide-gen-cli`，不再出现 `06-resource-backed-slide` 或 `univer-example-cli`。

根 README 不再把它放进“Read them in numbered order”的递进表。建议在编号 examples 后增加独立的 `Agent application` 小节：

```text
slide-gen-cli — Generate, review, export, and view a resource-backed Slide deck from a user brief
```

## 命令面

面向用户和 Agent 的最终命令面为：

```text
slide-gen-cli create
slide-gen-cli worktree ...
slide-gen-cli api find|show ...
slide-gen-cli resources find|export ...
slide-gen-cli compile-svg ...
slide-gen-cli execute ...
slide-gen-cli inspect slide ...
slide-gen-cli lint ...
slide-gen-cli screenshot ...
slide-gen-cli export deck.pptx ...
slide-gen-cli open ...
```

主 README 只演示从 brief 到 Ready URL/PPTX 的 happy path。API reference、Worktree lifecycle 和 diagnostics 的完整参数放在 command help；README 不重复一份参考手册。

## 依赖影响

当前 example 声明 53 个 direct dependencies。Slide-only 且保留 PPTX export 后，明确可以删除两个：

```text
@univerjs/preset-docs-core
@univerjs/preset-sheets-core
```

`@univerjs-pro/exchange-node` 与 `@univerjs-pro/exchange-node-binding` 为 PPTX export 保留。其余 Worktree、API reference、inspection、render、screenshot 和 layout packages 也保留。完成代码收敛后再根据实际 import graph、peer requirements、typecheck、build、PPTX export 和浏览器验证处理未使用依赖，不把猜测性 cleanup 纳入本次 scope。

为了让 Web Viewer 支持 Native Enhancement，需要新增四个与现有 Univer cohort 对齐的 direct dependencies：

```text
@univerjs-pro/slides-chart
@univerjs-pro/slides-chart-ui
@univerjs-pro/slides-table
@univerjs-pro/slides-table-ui
```

因此本 scope 不是单纯的 dependency reduction：删除两个跨 Unit presets，同时增加四个 Slide-native element packages。

## 测试与验收

保留三层验证：

1. command test：fixed resource library 完成 canonical handle find/export；`compile-svg` 产生零 warning 和预期 diagnostics；缺少导出资源时失败。
2. smoke test：至少按顺序生成两页，证明 existing-page replace、next-page append 和 skipped-page rejection；创建 Worktree，执行 generated programs，断言 confirmed commits；逐页 inspection、layout lint 和 PNG screenshot 通过；Worktree 可标记 Ready；同一 Worktree 可以导出有效 PPTX；Viewer URL 指向同一 Unit/Worktree。
3. Native fixture：在 Baseline Deck 之外插入最小 chart/table，验证 inspection、render、显式 chart mapping、零 exporter error，以及 PPTX 中的 chart XML、embedded workbook 和 table slide XML。
4. 真实 Web QA：启动 server，通过浏览器打开 Ready URL，确认多页与 native chart/table 可见、Worktree 状态正确，Reopen/Merge/Discard actions 与 trunk/worktree routing 正常。

删除继承 smoke test 中的 Sheet、Doc 和 import coverage。Baseline deck 使用 fixed manifest/fake downloader，自动验证不依赖远程 resource host。Chart/table 不强制进入 Baseline Deck；独立 Native fixture 验证这条可选 authoring path，避免把 baseline 变成 feature showcase。

## README 与 Agent skill

README 的核心入口应该是自然语言 brief，而不是让用户先手工执行完整 CLI 流程：

```text
使用 univer-slide-authoring，为我生成一份六页产品发布汇报：深色 16:9，
包含发布计划、指标图表和风险对照表。完成检查后给我在线审阅地址和 PPTX。
```

README 仍提供安装、启动 Server、安装 skill 和手工 smoke 命令，便于理解与排障。

`univer-slide-authoring` skill 应覆盖：

- 从 brief 生成 deck-level spec、叙事顺序和逐页内容合同；
- 每页独立 SVG source 与按页码顺序的首次 compile/execute；
- API reference 与 Resource Library 查询；
- 多页 replace、追加和逐页修正语义；
- SVG chart/table，以及需要时的 native chart/table enhancement 与重放顺序；
- 逐页 inspect/lint/screenshot 与 deck-level visual review；
- Worktree Ready、Web URL 和可选 PPTX export。

skill 只继续排除 import、通用 template system 和用手写 Facade calls 绕过 SVG 进行普通 shape/text/image authoring。它不限制页数、chart、table 或 PPTX export。

## 与既有调研的关系

- [`2026-09-02-resource-backed-slide-feasibility.md`](./2026-09-02-resource-backed-slide-feasibility.md) 的 Resource Library、SVG compiler、Worktree、Review Evidence 和专用 skill 结论继续有效；其中单页 Baseline 是当时的最小测试设计，不再构成 application 能力上限。
- 本文撤销先前对单页、chart、table 和 PPTX export 的限制。
- [`2026-09-02-univer-cli-sdk-capabilities.md`](./2026-09-02-univer-cli-sdk-capabilities.md) 保持不变。

## 对领域模型与当前 OpenSpec Change 的影响

`CONTEXT.md` 当前把 `Authoring Source` 描述为单个 SVG page，并使用 `Baseline Slide`。实现前应把 application 级 source 扩展为 deck spec、逐页 SVG、资源和可选 native enhancements，并增加或调整 deck-level baseline 术语；`Review Evidence` 应覆盖逐页证据与跨页一致性检查。

未归档 Change `add-resource-backed-slide-example` 的 Worktree/Review Evidence 设计可以保留，但 artifacts 需要调整：

- intent 从单页 Resource-backed Slide 改为由 brief 驱动的多页 Slide deck generation；
- target path 从 `examples/06-resource-backed-slide` 改为 `examples/slide-gen-cli`；
- package、binary、README 和 skill command examples 改为 `slide-gen-cli`；
- 保留 Agent/review chain 和 PPTX export，删除 Sheet、Doc 与 import；
- delta spec 增加 page append/replace、native chart/table authoring 顺序和 Worktree PPTX export；
- tests 删除跨 Unit/import coverage，增加多页顺序语义、PPTX export 和新的目录/命令身份断言；
- 根 README 把它列为独立 Agent application，而不是编号课程。

Change ID 和 capability ID 可以保留；它们描述变更历史与领域能力，不是用户可见的 example 名称。下一步先用 `$openspec-update-change add-resource-backed-slide-example` 按本文修订 domain terms、proposal、design、spec 和 tasks，再实施代码改动。

## 决策

`slide-gen-cli` 是一个面向 Agent 的 Slide deck 生成器，不限制页数，并允许 chart、table 和 PPTX export。它保留 API reference、Resource Library、SVG compiler、Worktree、Review Evidence 与在线 Viewer；只移除 Sheet、Doc 和 Office import。目录、package、binary 与文档统一使用 `slide-gen-cli`，不再使用 `06` 编号。
