# Resource-backed Slide 示例的可行性与 Scope

- 调研日期：2026-09-02
- 窄问题：`06-resource-backed-slide` 能否借助 Univer CLI SDK 的 SVG compiler 构建一张漂亮且可审阅的 Univer Slide，最小教学 scope 是什么？
- SDK 源码基线：[`dream-num/univer-cli-sdk@de3d8dc`](https://github.com/dream-num/univer-cli-sdk/tree/de3d8dc729d3d36d05cad3261a3c2830df51e5ec)（2026-09-01）。
- 参考 application 基线：[`dream-num/univer-cli@ef56176`](https://github.com/dream-num/univer-cli/tree/ef561767ec8e75dc583326e7b26ace5c1cb98554)（2026-09-01）。
- 前置能力清单：[Univer CLI SDK 面向示例作者的能力与边界](./2026-09-02-univer-cli-sdk-capabilities.md)

## 结论

目标可在本仓库当前 `1.0.0-beta.2` 依赖队列上实现。四个新增 `@univer-cli/*` capability package 都公开发布了 `1.0.0-beta.2`，`@univerjs-pro/cli-assets@0.1.0` 也公开可安装；它们不引入不同队列的 Univer dependency。版本证据、tarball API 和 install dry-run 见 [Resource-backed Slide 包版本可用性](./2026-09-02-resource-backed-slide-package-versions.md)。

参考 application 使用的 `1.0.0-insiders.20260831-796c4f4` 不在这四个 package 的公开 registry metadata 中，精确版本 endpoint 返回 404，不能作为 example 依赖。`06` 保持与 `04-worktree` 相同的 beta.2 队列，只新增四个 `@univer-cli/*@1.0.0-beta.2` 和 `@univerjs-pro/cli-assets@0.1.0`。

一个 Change 足够：一个页面、一个明确主题、Resource Library 与 SVG compiler 两个新增 capability，以及一个只服务该教学闭环的 Agent skill。示例复用 `04-worktree` 的执行和审阅链，不继承未来 `05` 的 daemon/runtime pool。

## 已确认的规划约束

- `Resource-backed Slide` 必须实际包含至少一个通过 Resource Library stable handle 查找并导出的视觉资源，并完成 compile、commit、inspect、lint 和 screenshot 闭环。术语定义见 [`CONTEXT.md`](../../CONTEXT.md)。
- 原先采用 insiders 的决定已被 registry 一方证据推翻；已重新确认 `06` 保持与既有 examples 相同的 beta.2 队列。
- `06` 保留 `04-worktree` 的完整命令面与运行基础设施，只把 README 主路径和 `univer-slide-authoring` skill 聚焦到单页 Slide。
- 仓库提交一张原创 `authoring/page.svg` 作为可运行基线；skill 允许 Agent 按用户的一页 brief 重写 Authoring Source，smoke test 只验证固定基线。
- 编译和应用保持标准两步接口：`compile-svg --out` 生成 disposable Facade program，`execute --file` 负责 Worktree mutation 与 commit；不复制自定义 `--apply` adapter。
- 使用 deterministic text estimator，并把 compiler lint、layout lint 和 screenshot review 作为强制修正循环；只有实际基线无法通过视觉验收时才增加 browser-backed measurer。
- Baseline Slide 固定引用一个 canonical resource handle，但不提交导出的资源；README 的真实路径必须运行 `resources export`，smoke test 使用 fixed manifest 与 fake downloader，二者都物化同名 asset。
- `createProgram()` 增加一个可选 `openResourceLibrary` 测试接缝；默认仍使用官方 manifest、filesystem cache 与 downloader，测试通过进程内 command invocation 验证 find/export。
- Baseline Slide 采用 960 × 540 的“产品发布状态”设计：深色背景、标题与副标题、三个等宽状态卡、横向流程线，以及一个 canonical resource。验收要求零 compiler warning、除 estimation 外无未解释 compiler lint、零 layout finding，并通过最终截图人工确认对齐、层级、对比度和内容完整性。

## 已验证的能力边界

Resource Library 从 application 选定的 asset manifest 组装 registries、稳定 handle、HTTPS 下载、filesystem cache 和导出。参考 application 使用 `@univerjs-pro/cli-assets/manifest.json`，把 cache 放在 application home 下，并直接装配 SDK 的 `createResourcesCommand()`。[Resource composition](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/src/program.ts) [Resource Library README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/resource-library/README.md)

SVG compiler 读取 SVG source 和调用方解析的相对 SVG/image 引用，返回 Facade code、viewport、warnings、lints 与 text-measure source。`wrapSlideScript()` 把 code 绑定到 1-based page；replace 模式清空目标页，并按 SVG viewport 设置页面尺寸。[SVG capability README](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/svg-facade/README.md)

compiler 不创建 Unit、不获取 runtime lease、不执行也不 commit。参考 application 为此实现了自定义 `compile-svg --apply` adapter，但教学 example 已经有更小的组合：标准 `compile-svg --out` 生成程序，再交给 `04-worktree` 的 `execute --file`。[SVG application adapter](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/src/features/svg/command.ts) [command preset](https://github.com/dream-num/univer-cli-sdk/blob/de3d8dc729d3d36d05cad3261a3c2830df51e5ec/packages/svg-facade-command/README.md) [04 execute seam](../../examples/04-worktree/src/cli/features/unit-content.ts)

## 最小教学闭环

```text
resources find/export
  → page.svg 引用导出的 SVG 文件
  → compile-svg --page 1 --out page.js
  → execute --file page.js 写入 Worktree
  → inspect + lint + screenshot + Web review
```

README 主路径固定为一张 16:9 页面和一个确定主题，例如“产品发布状态”：深色背景、标题与副标题、三个状态卡、一条流程线、一个从 registry 导出的插图或同风格图标组。

页面使用普通 SVG 的 `rect`、`circle`、`line`/`path`、`linearGradient`、`text`、`<image href="./resources/…svg">` 和必要的 `<g>`。页面 source 是主要教学材料；生成的 Facade JavaScript 不提交。

```bash
univer-example-cli resources find rocket launch --limit 5 --json
univer-example-cli resources export <registry>/<resource> --out authoring/resources --json

univer-example-cli compile-svg authoring/page.svg --page 1 \
  --out .generated/page.js --estimate-text-size --json
univer-example-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file .generated/page.js

univer-example-cli inspect slide index:1 --unit "$UNIT_ID" \
  --worktree "$WORKTREE_ID" --json
univer-example-cli lint --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --pages 1 --json
univer-example-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --out output --json
```

示例显式使用 `--estimate-text-size`，并保留 command 产生的 estimation lint。页面用宽裕文本框、常用字体和短文案降低估算误差，现有 screenshot 与 layout lint 承担最终视觉校验。只有实际截图证明字体测量是主要缺陷时，才把 Render Runtime 的 `measureText()` 适配成 `SvgTextMeasurer`。[browser measurer reference](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/src/features/render/service.ts) [Slide authoring rules](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/src/skills/runtime/slide/SKILL.md)

## 专用 Agent Skill

`06` 不应继续安装从 `04-worktree` 继承的通用 `univer-content` skill。它同时覆盖 Sheet、Doc、import、export 和任意 Facade execution，会让 Agent 绕过本例要教授的 SVG 路径。用一个独立的 `skills/univer-slide-authoring/SKILL.md` 替换它；现有 `scripts/skill.mjs` 只需把 symlink source/link 改成 `univer-slide-authoring`。

skill 保持单文件、自包含，不增加 `references/`、脚本或 `agents/openai.yaml`。需要保留的知识都直接影响本例的决策；参考 Slide skill 中的多页 deck、chart、table、transition、已有元素编辑和任意 Facade 细节不进入本 skill。[参考 Slide skill](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/src/skills/runtime/slide/SKILL.md)

建议的 skill 如下：

```markdown
---
name: univer-slide-authoring
description: Create or redesign one reviewable Univer Slide page from SVG and resource-library assets in the 06-resource-backed-slide example.
---

# Author one Univer Slide page

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `06-resource-backed-slide` directory.

Keep the editable source in `authoring/page.svg`, exported assets in
`authoring/resources/`, generated code in `.generated/`, and screenshots in `output/`.

## Workflow

1. Fix the page's exact copy, one core message, 960 × 540 layout, colors, font roles, and required
   asset meanings before drawing. This example produces one page only.
2. Create a Slide Unit and Worktree. Retain both IDs for every later command.
3. Create `authoring/resources/`, `.generated/`, and `output/`. Find assets by meaning with
   `resources find`, then export canonical handles with
   `resources export ... --out authoring/resources`. Keep one registry/style baseline. Reference
   the exported file by its `<registryId>--<resourceId>.svg` name; do not copy its path data,
   substitute Unicode glyphs, or invent placeholder icons.
4. Author the complete page as ordinary SVG. Use inline styles and document order for stacking.
   Every `<image>` needs width and height. Use positioned elements instead of repeated spaces;
   multiline text uses `<tspan>` with scalar `x` and absolute `y` or non-zero `dy`. Use fractional
   object-bounding-box gradient coordinates. Avoid filters, masks, translucent gradients, and
   radial gradients on non-square shapes.
5. Compile page 1 with:

   ```bash
   univer-example-cli compile-svg authoring/page.svg --page 1 \
     --out .generated/page.js --estimate-text-size --json
   ```

   Stop on every compiler error or warning. Review every lint; the deterministic text-estimation
   lint is expected, while any other surviving lint needs an explicit reason.
6. Apply the generated program once with `execute --file .generated/page.js`. Continue only when
   the result reports `commit: "confirmed"`; otherwise return the result and stop.
7. Inspect `slide index:1`, run layout lint for page 1, capture its screenshot, and read the PNG.
   Check clipping, text overflow/wrapping, text overlap, alignment, sibling icon sizing, contrast,
   missing content, and stacking. Treat each lint as a defect until its evidence shows an
   intentional overlap.
8. Fix `authoring/page.svg`, then compile and execute the replacement again. Never use `--add` for
   rework because it leaves the broken elements under the new ones. Repeat inspection, lint, and
   screenshot review until warnings are zero and every lint is fixed or justified.
9. Mark the Worktree Ready and print its review URL with `open --no-launch`. Return the Unit ID,
   Worktree ID, revision, SVG and exported-asset paths, accepted lints, screenshot path, and review
   URL. Open the browser only when the user asks.

Do not hand-write Facade drawing code, add pages, charts or tables, build a template system, or
replace final screenshot review with the SVG browser preview.
```

skill 的 frontmatter 足以支持自动发现：请求必须同时指向本 example 与单页 Slide authoring，避免抢占通用 Univer 内容任务。实现后运行 `quick_validate.py` 检查 frontmatter/name，并实际执行 `pnpm skill:install`、读取 `.agents/skills/univer-slide-authoring/SKILL.md`、再执行 uninstall，验证 symlink 生命周期。

## 实现 Scope

1. 从 `04-worktree` 建立独立 `06-resource-backed-slide`，整组对齐到包含 Resource Library 与 SVG compiler 的发布队列。
2. 在 composition root 装配 beta.2 的 `createResourcesCommand()` 与 `createCompileSvgCommand({ textMeasurer: builtinTextMeasurer })`；Resource Library 使用 application 选定的绝对 cache root 和 `@univerjs-pro/cli-assets/manifest.json`。
3. 增加一张原创 `authoring/page.svg`，引用 `authoring/resources/` 中由稳定 handle 导出的资源；忽略生成的 resource、`.generated/` code 和 `output/` screenshot，不提交这些运行产物。
4. 用 `skills/univer-slide-authoring/SKILL.md` 替换继承的通用 skill，并更新现有 install/uninstall symlink 脚本；skill 只指导单页 resource-backed SVG authoring 与视觉验收。
5. README 演示 create Slide → create Worktree → find/export → compile → execute → inspect/lint/screenshot → open/Ready，并同步中英文与根目录索引。
6. smoke test 覆盖固定 manifest/fake downloader 下的 resource handle/export、零 compiler warning、生成程序可执行并 commit、第一页可 inspection、layout lint 无 text finding、screenshot 是 PNG。测试不依赖外网或远程 asset 可用性；另验证 skill frontmatter 与 symlink install/uninstall。

`warnings` 必须为零，因为它表示 SVG 语义发生降级；`lints` 逐项记录处理，其中 deterministic text estimation lint 是本例明确接受的教学取舍。资源下载失败、未知 handle、缺失相对 asset、compile error 或 commit 非成功状态都必须让 smoke path 失败。

## 明确排除

- 不实现自定义 `--apply`、browser text measurer、daemon、runtime pool 或新的持久化格式。
- 不做多页 deck、动态图表、PPTX export、Agent 自动选图或通用 slide template system。
- 不保留继承自 `04` 的通用 `univer-content` skill，也不复制参考 Slide skill 的非 SVG 章节。
- 不演示自定义 registry、认证 header、cache clear 和下载策略；application 仍应只信任自己选择的 manifest。
- 不把外部 resource path data 复制进 page SVG；保留导出文件及其 registry handle 边界。
- 不承诺所有 browser-valid SVG 都能无损转换；本例只选择 compiler 已覆盖且能达到零 warning 的子集。

## 决策

`06-resource-backed-slide` 的 scope 已收敛，版本门槛也已解除。规划结论是一个 Change、一个 `resource-backed-slide-authoring` capability，并按本文已确认约束生成 proposal、delta spec、design 和 tasks。

后续 `$tina-propose-plan` 必须显式读取本文件，不从通用 capability note 推断本次结论。
