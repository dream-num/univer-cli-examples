# Slide Gen CLI

[English](./README.md) | 简体中文

本例把普通 SVG 编译成一页可审阅的 Univer Slide。Resource Library 用 stable handle
导出视觉资源，SVG compiler 生成一次性 Facade JavaScript，Worktree runtime 提交结果，
再用结构化与视觉证据验收。

```text
stable handle → 导出 SVG 资源 → page.svg → compile-svg → execute → Review Evidence
```

本 application 只支持 Slide，并保留 API reference、resources、SVG compile、execute、
inspection、layout lint、screenshot、Worktree review、Web 查看与 PPTX export。

## 运行

在当前目录执行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm link-cli
pnpm start-server
```

保持 Server 运行。另开终端，准备固定 rocket 资源并编译仓库中的 Baseline Slide：

```bash
mkdir -p authoring/resources .generated output

slide-gen-cli resources find rocket \
  --registry example-tabler-outline --json
slide-gen-cli api find appendShape --unit slide
slide-gen-cli resources export example-tabler-outline/rocket \
  --out authoring/resources --json

slide-gen-cli compile-svg authoring/page.svg --page 1 \
  --out .generated/page.js --estimate-text-size --json
```

编译结果必须报告 `960 × 540` viewport、page `1`、`builtin-estimate`、零 warnings，且
只有预期的文字估算 lint。未导出资源时，编译必须停止并指出
`resources/example-tabler-outline--rocket.svg`。

创建 Slide Worktree，再执行生成的 replace program：

```bash
UNIT_ID=$(slide-gen-cli create --name "产品发布状态")
WORKTREE_ID=$(slide-gen-cli worktree create --unit "$UNIT_ID")

slide-gen-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file .generated/page.js
```

只有 execution 返回 `commit: "confirmed"` 时才继续。交付前收集全部 Review Evidence：

```bash
slide-gen-cli inspect slide index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli lint --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --json
slide-gen-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --out output --json
```

layout findings 必须为零。打开 PNG，检查对齐、层级、对比度、资源渲染和内容完整性。
有问题时修改 `authoring/page.svg`，然后重复 replace compile/execute；修正时不使用 `--add`。

证据通过后：

```bash
slide-gen-cli worktree ready "$WORKTREE_ID"
slide-gen-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --no-launch
slide-gen-cli export product-release.pptx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

Review URL 仅在本 application 的内置 Server 运行期间有效。需要持久文件时从同一
Worktree 导出 PPTX；使用 `--trunk` 可导出 trunk revision。

## 交给 Agent 使用

保持 Server 运行，安装专用 skill：

```bash
pnpm skill:install
```

用 Agent 打开当前目录，然后输入：

```text
使用 univer-slide-authoring 重新设计这张单页发布状态 Slide，完成检查后把 Worktree 交给我审阅。
```

体验结束后：

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## 文件与边界

- `authoring/page.svg` 是仓库提交的 Authoring Source。
- `authoring/resources/`、`.generated/`、`.data/`、`output/` 和 `dist/` 都是可丢弃且被忽略的运行产物。
- `skills/univer-slide-authoring/SKILL.md` 约束 Agent 遵循 resource-backed SVG workflow。
- `test/program.test.ts` 和 `test/smoke.test.ts` 使用 fixed manifest/fake downloader，自动验证不依赖远程资源 host。

本 Change 保留现有单页 authoring baseline，不增加多页 deck、Native Enhancement、chart、
table、template 或手写 Facade drawing code。
