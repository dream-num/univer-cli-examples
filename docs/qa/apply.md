# Tina apply QA report

日期：2026-09-03  
仓库：`/Users/shenweimin/.herdr/worktrees/univer-cli-examples/worktree-green-field-d693`  
本轮基线：`2867090`（reviewer fix，基于 `8a079a8`、`6a9b457`、`07e2e9e`、`80f0c74`）

## 范围和准备

本轮按 `tina-qa` 要求执行了真实服务、真实 `agent-browser` 会话、CLI、PPTX/OOXML 和回归检查。已阅读：

- `AGENTS.override.md`（仓库中没有另一个 `AGENTS.md`）；
- `CONTEXT.md`；
- `docs/proposal-plan/2026-09-02-slide-gen-cli.md`；
- `docs/research/2026-09-02-slide-gen-cli-scope.md`；
- 两个 Change 的 `proposal.md`、`design.md`、`tasks.md` 和 delta spec；
- 当前 `examples/slide-gen-cli` 实现、README/README.zh-CN、skill 和测试。

服务使用 `http://127.0.0.1:3010`。证据根目录为 `/tmp/slide-gen-qa-third-P6QiTs`；所有 browser 证据使用同一原有 session `slide-gen-qa-3439f60dc34f` 的 `open`、`wait`、`snapshot`、`eval`、`click`/鼠标事件和 console/error 采集，没有使用会卡住的 `screenshot --annotate`。CLI 生成的 PNG 作为视觉证据保留。

本轮结束时已关闭本轮启动的 server、browser daemon 和 Chrome profile；`3010` 无监听且 `curl --max-time 2 http://127.0.0.1:3010/` 不可达。其他预先存在的 Chrome profile 未触碰。

## Reviewer fix 定向复测：`2867090`

该 commit 只修改 `examples/slide-gen-cli/README.md`、`README.zh-CN.md`、
`skills/univer-slide-authoring/SKILL.md` 和 `test/program.test.ts`。没有 runtime 代码变化，因此第三轮已经取得的真实浏览器证据和 01–04 串行回归证据继续适用，本次不重复启动服务或浏览器。

### 三份 Agent 指导

英文 README、中文 README 和 `univer-slide-authoring/SKILL.md` 均明确要求：含 native chart/table 的 PPTX handoff 前先检查 exporter diagnostics；核验 OOXML 中的 chart category/value data、embedded workbook 和 native table 的 slide XML；不能只返回文件路径。三份文案由新增的 `requires native PPTX acceptance evidence before handoff` 测试逐份读取并断言，8 个测试全通过。对应文案位置为：

- `examples/slide-gen-cli/README.md:89-92`；
- `examples/slide-gen-cli/README.zh-CN.md:88-90`；
- `examples/slide-gen-cli/skills/univer-slide-authoring/SKILL.md:62-65`。

### Skill validator 与生命周期

执行：

```text
uv run --with pyyaml -- python /Users/shenweimin/.codex/skills/.system/skill-creator/scripts/quick_validate.py examples/slide-gen-cli/skills/univer-slide-authoring
Skill is valid!
```

在 `examples/slide-gen-cli` 中执行 `pnpm skill:install` 后，`.agents/skills/univer-slide-authoring` 是指向 `../../skills/univer-slide-authoring` 的 symlink，安装路径中的 `SKILL.md` 存在且与 source `cmp` 一致；随后 `pnpm skill:uninstall` 成功并清除 symlink。

### Check、diff 和源码洁净度

`examples/slide-gen-cli pnpm check` 退出码 0：format check、lint、node/web typecheck、build 均通过，Vitest 报告 `Test Files 4 passed (4)`、`Tests 8 passed (8)`。构建保留既有的大 chunk warning，不影响通过。

`git diff --check 8a079a8..2867090` 通过。该 commit 的文件清单仅为上述四个文档/测试文件；`git status` 只有本 QA 报告目录的未跟踪内容，源码工作树变更数为 0。没有修改实现源码、提交或 archive。

### 沿用的 runtime acceptance 证据

`8a079a8` 之后 runtime 未变，以下第三轮证据仍覆盖本次基线：

- Ready Worktree 两页真实 thumbnail click：`shimmers=0`、`appInert=false`、`editorLocked=true`，page 1/page 2 物理点击分别改变 selected 状态和 canvas hash `7caa8236 ↔ fa23a864`；编辑区保持有效 inert。证据在 `baseline/browser-ready.*.eval.json` 和 snapshot。
- Draft native fixture 真实 chart click/double-click 出现 `Chart editor`、`Setup`、`Customize`、`Modify data`；table 真实点击选中 `Table Design`。structured bounds 为 `left=590,width=360,right=950`，panel 内。
- replacement → enhancement → replacement removes → replay、Ready/Reopen/Merge/Discard、trunk/Worktree routing 和 Worktree/trunk PPTX export 已通过；OOXML 含 chart XML 的 `c:cat/c:val`、embedded workbook 和 slide XML 的 `<a:tbl>`。
- 01–04 已在停止 3010 server 后串行执行，四个 `pnpm check` 均 exit 0。

上述证据保存在 `/tmp/slide-gen-qa-third-P6QiTs/`，原完整第三轮记录仍见本报告的 Change 1/Change 2 小节。

## Change 1：evolve-resource-backed-slide-into-slide-gen-cli

### CLI identity、Slide-only surface 和回归

`examples/slide-gen-cli pnpm check` 通过，退出码 0；4 个测试文件、7 个测试通过。证据：
`/tmp/slide-gen-qa-third-P6QiTs/slide-gen-cli-check.log` 和 `.exit`。

`surface/root-help.txt` 和 `surface/create-help.txt` 确认 CLI 身份为 slide-only：`create` 仅接受 slide name，没有 type 选择；help 没有 `import`、Sheet 或 Doc surface。实际 rejection：

- `node dist/cli/main.js import` 退出码 1，`unknown command 'import'`；
- `node dist/cli/main.js create --type sheet` 退出码 1，`unknown option '--type'`；
- 将 export 目标设为 `.xlsx` 退出码 1，`Slide export file must end in .pptx`。

证据在 `/tmp/slide-gen-qa-third-P6QiTs/surface/` 和 `baseline/export-xlsx.*`。legacy `POST /api/units` 传入 `type: sheet` 后服务返回 `unitType: slide`，fetch 也返回 slide，证据为 `surface/legacy-create.json`、`legacy-fetch.json`、`legacy-create.headers`。

### Baseline 两页 deck

Baseline unit/worktree 为 `15067d9c` / `2531c645`。page 1、page 2 按顺序 compile/execute，两个 compile 的 viewport 均为 `960x540`、`textMeasure: builtin-estimate`、warnings 为空；execute 分别确认 revision 2/3。证据：
`baseline/compile-1.json`、`compile-2.json`、`execute-1.json`、`execute-2.json`。

`inspect presentation` 返回两页且顺序正确：page 1 统计 shapes 40、images 1，文本预览为 product release status；page 2 统计 shapes 20，文本预览为 launch plan。`baseline/inspect-presentation.json`、`inspect-page-1.json`、`inspect-page-2.json` 为证据。

Baseline lint findings 为空，覆盖 page 1/2；CLI screenshot 生成两张有效 `1920x1080` PNG，路径记录在 `baseline/screenshot.json`。page 1 使用了已提交的 canonical stable resource `authoring/resources/example-tabler-outline--rocket.svg`。

### Ready URL 真实浏览器验收

Ready URL：
`http://127.0.0.1:3010/?unit=15067d9c&worktree=2531c645`，记录于 `baseline/review-url.txt`。初始 browser eval（`baseline/browser-ready.initial.eval.json`）确认：

- `appInert=false`；
- `editorLocked="true"`；
- `shimmers=0`；
- page 2 selected；
- 画布 hash 为 `7caa8236`。

通过真实鼠标事件点击 page 1 缩略图并等待，`after-page1.eval.json` 确认 page 1 selected、画布 hash 变为 `fa23a864`；再真实点击 page 2，`after-page2.eval.json` 确认 page 2 selected、画布 hash 恢复 `7caa8236`。对应 snapshot 保存在同目录。这证明缩略图物理点击会切换选中页和主画布内容。

同一组 eval 还确认 header inert，canvas 位于 inert 的祖先 section 中，故编辑区域有效锁定；缩略图本身 `inert=false`，可以被点击。`baseline/browser-ready.lock.eval.json` 保存了完整 ancestor/inert 证据。browser errors 和 console 均为空。

### Page transition、stable resource、Worktree PPTX

transition fixture 使用 page 1、page 2、替换 page 1、append page 3 的顺序执行，revision 依次到 5；page 5 execute 正确拒绝并报告 deck 只有 3 页、最大可寻址 page 为 4。最终 inspect 为恰好 3 页，没有空白 gap。证据在 `transition/`。

Ready Worktree URL 的 `baseline/ready.json` 为 ready。Worktree export 为有效 OOXML PPTX，`baseline/worktree.pptx` 含 `ppt/slides/slide1.xml` 和 `slide2.xml`，证明为两页输出。

## Change 2：enable-agent-deck-authoring-in-slide-gen-cli

### Native fixture：replacement、enhancement、replacement removes、replay

Native unit/worktree 为 `00e7c606` / `79356a1c`，初始为 Draft。native fixture page compile warnings 为空；初始 execute revision 2。enhancement execute revision 3，structured count 为 charts 1、tables 1。证据：
`native/compile.json`、`execute-page.json`、`execute-enhancement.json`、`counts-enhancement.json`。

结构化 inspect 确认 table 可编辑并位于 panel 内：table `left=590, top=160, width=360, height=250`，因此 `right=950`；panel `left=580, width=370`，right 也是 950。`native/inspect-enhancement.json`。lint findings 为空，CLI PNG 为 `native/output/page-01.png`（1920x1080）。

随后在同一 worktree 执行 replacement，revision 4，`charts=0,tables=0`；再 replay enhancement，revision 5，恢复 `charts=1,tables=1`，相同 table bounds，lint 仍为空，replacement/replay PNG 均有效。证据为 `native/replace-after-browser.json`、`counts-after-replacement.json`、`inspect-after-replacement.json`、`replay-after-browser.json`、`counts-after-replay.json`、`inspect-after-replay.json`、`lint-after-replay.json`、`screenshot-after-replay.json`。

### Draft browser：chart 和 table 的真实选择

Draft URL：`native/draft-url.txt`。初始 browser eval 确认 Draft、`shimmers=0`、`editorLocked="false"`、`appInert=false`。

通过真实鼠标点击并双击 chart 位置，snapshot/eval 显示 chart 专属 UI：`Chart editor`、`Setup`、`Customize`、`Modify data`、`Column chart`，以及 Stage/Completion 数据区。证据：
`native/browser-draft.after-chart-click.snapshot.json`、`after-chart-dblclick.snapshot.json` 及对应 eval。

关闭 chart sidebar 后，通过真实鼠标点击 table 位置，snapshot/eval 显示 `Table Design` tab 被选中；table 的结构化 bounds 仍为 `left=590,width=360,right=950`，在 panel 内。证据：`native/browser-draft.table-click2.snapshot.json` 和 `.eval.json`。没有用 DOM/source 推测替代物理点击。

### Ready、Reopen、Merge、Discard 和 routing

真实点击 Ready 后 status 变为 ready，出现 Reopen/Merge/Discard；真实点击 Reopen 后回到 draft；再次 Ready 后真实点击 Merge，status 变为 merged，worktree 行显示 merged。随后新建 Draft worktree `b721b0a7`，真实点击 Discard 后 status 变为 discarded，worktree 行显示 discarded。证据依次为：

- `native/browser-after-ready.eval.json` / `.snapshot.json`；
- `native/browser-after-reopen.eval.json` / `.snapshot.json`；
- `native/browser-after-ready2.eval.json`；
- `native/browser-after-merge.eval.json` / `.snapshot.json`；
- `native/browser-after-discard.eval.json` / `.snapshot.json`。

Trunk URL `http://127.0.0.1:3010/?unit=00e7c606` 与 Worktree URL 均实际打开。trunk eval 确认 `trunk · editable`、`shimmers=0`、`editorLocked="false"`。Worktree export 和 `--trunk` export 都成功，分别为 `native/worktree.pptx`、`native/trunk.pptx`。

两份 PPTX 的 OOXML 均包含：

- `ppt/charts/chart1.xml`；
- `ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx`；
- `ppt/slides/slide1.xml` 中的 `<a:tbl>`；
- chart XML 中的 `c:cat` 和 `c:val`。

这验证了 native chart/table 的可见、可编辑导出路径以及 embedded workbook。Review URL 只通过 Server-scoped `127.0.0.1:3010` 提供，没有把 review URL 作为 Worktree artifact。

### 用户文档和 examples 回归

英文/中文 README 均实际写明 `inspect presentation`，并描述 Slide-only、Presentation Brief/deck spec、可选 native chart/table、Ready URL/PPTX；没有宣传 import、Sheet、Doc、template 或 public host。skill 文档与该 user story 一致。

停止 3010 server 后，按要求串行运行并取得有效 exit 0：

- `examples/01-content-operations pnpm check`：1 file、2 tests passed；
- `examples/02-file-exchange pnpm check`：1 file、2 tests passed；
- `examples/03-visual-inspection pnpm check`：1 file、1 test passed；
- `examples/04-worktree pnpm check`：1 file、1 test passed。

日志和 exit 文件在 `/tmp/slide-gen-qa-third-P6QiTs/regression/`。各测试遗留的精确监听进程已在对应串行步骤清理，最终 3010 已释放。

## Issues

### Critical

None.

### Warning

None.

### Suggestion

Vite build 输出了既有的单个大于 500 kB chunk 警告；本轮不影响构建、测试、CLI、浏览器验收或 PPTX 导出。

## Verdict

**QA passed.** 本轮 required acceptance 全部取得真实或可复核的 CLI/OOXML 证据；未修改源码、未提交、未 archive。交付给实现方的完整报告路径：`docs/qa/apply.md`。
