# Slide Gen CLI

[English](./README.md) | 简体中文

本例只支持 Slide，把 Presentation Brief 转成可审阅的 Univer deck。仓库提交的 Authoring
Source 包含 deck spec、连续 SVG pages、stable-handle resources，以及可选的 editable native
chart/table programs；生成的 Facade JavaScript 仍是一次性产物。

```text
Presentation Brief → deck spec → SVG pages → compile/execute → evidence → Ready review
                                      ↘ 可选 Native Enhancement replay
```

## 运行 Baseline Deck

在当前目录执行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm link-cli
pnpm start-server
```

保持 Server 运行。另开终端，编译仓库提交的两个 960 × 540 pages：

```bash
mkdir -p .generated output

slide-gen-cli compile-svg authoring/pages/page-01-status.svg --page 1 \
  --out .generated/page-01.js --estimate-text-size --json
slide-gen-cli compile-svg authoring/pages/page-02-handoff.svg --page 2 \
  --out .generated/page-02.js --estimate-text-size --json
```

Page 1 使用仓库提交的 canonical rocket export；page 2 证明并非每一页都需要引用资源。
出现 compiler warning 时停止，并检查每一条 lint。

创建一个 Slide Worktree，按连续页码执行：

```bash
UNIT_ID=$(slide-gen-cli create --name "产品发布 deck")
WORKTREE_ID=$(slide-gen-cli worktree create --unit "$UNIT_ID")

slide-gen-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file .generated/page-01.js
slide-gen-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file .generated/page-02.js
```

每次 execution 都必须报告 `commit: "confirmed"`。重新执行已有页码会 replace 该页；
`pageCount + 1` 会 append 下一页；跳过页码会失败且不会生成空白页。workflow 不设最大页数。

## 审阅与交付

为每一页保存 structured inspection、layout diagnostics 和 screenshot：

```bash
slide-gen-cli inspect slide presentation \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli inspect slide index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli inspect slide index:2 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli lint --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1,2 --json
slide-gen-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1,2 --out output --json
```

要求 layout findings 为零，或为每条保留明确证据。打开每张 PNG，再检查整个 deck 的叙事、
字体、颜色、资源风格、page size 和 native-element placement。修正时重新编译并执行对应
页码；不要用 `--add` 叠加修改。

如果某页需要 editable native chart/table，在该页最后一次 SVG replacement 后执行已保存的
enhancement program。Chart 必须显式设置 category field 和 value fields mapping。以后再次
replace 该页时，需重放 enhancement。

证据通过后：

```bash
slide-gen-cli worktree ready "$WORKTREE_ID"
slide-gen-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --no-launch
slide-gen-cli export product-release.pptx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

Review URL 仅属于当前 Server，并且只在 Server 运行时可用。PPTX export 是按需操作；应从
审阅者验收的同一个 Worktree revision 导出。

## 交给 Agent 使用

```bash
pnpm skill:install
```

用 Agent 打开当前目录，然后输入：

```text
使用 univer-slide-authoring 把我的 Presentation Brief 制作成已审阅的 Slide Worktree。
```

体验结束后：

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## 文件与边界

- `authoring/deck.md` 是提交到仓库的 Presentation Brief 和 deck spec。
- `authoring/pages/page-NN-*.svg` 与 `authoring/resources/` 是提交到仓库的 Authoring Source。
- `authoring/enhancements/` 保存可选、可重放的 native chart/table programs。
- `.generated/`、`.data/`、`output/` 和 `dist/` 是可丢弃且被忽略的产物。
- `test/program.test.ts`、`test/smoke.test.ts` 与 `test/native.test.ts` 使用固定输入和本地
  assets，因此自动验证不会访问远程 asset host。

本 application 不提供 Sheet/Doc authoring、Office import、template、hosted publishing，
普通元素也不使用手写 Facade drawing code。
