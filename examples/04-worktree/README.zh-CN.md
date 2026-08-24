# 04 Worktree

[English](./README.md) | 简体中文

这个 example 完整保留 03 的文件交换与视觉检查，只增加 Worktree：Agent 在隔离 draft 中修改，标记
Ready 后由人通过 Web 审阅，再选择 Merge 或 Reopen。

```text
Trunk（只读）→ Worktree draft（编辑）→ Ready → Web 审阅 → Merge / Reopen
```

## 运行

进入本 example 后，所有命令都在当前目录执行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

另开终端，创建 trunk Unit 和对应的 Worktree：

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Worktree Demo")
WORKTREE_ID=$(univer-example-cli worktree create --unit "$UNIT_ID")
```

查看可以选择 trunk 或 Worktree；编辑必须指定 Worktree：

```bash
univer-example-cli inspect workbook --unit "$UNIT_ID" --trunk
univer-example-cli inspect workbook --unit "$UNIT_ID" --worktree "$WORKTREE_ID"

univer-example-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --code 'workbook.getActiveSheet().getRange("A2:B2").setValues([["Draft", 2]])'

univer-example-cli inspect range A1:B2 --worksheet index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json

univer-example-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --sheet Data --range A1:B2 --out output
```

Agent 完成检查后将 Worktree 标记为 Ready，并打开 Web：

```bash
univer-example-cli worktree ready "$WORKTREE_ID"
univer-example-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

Web 在 draft 状态允许编辑，在 Ready 状态提供 Reopen 和 Merge。Merge 后可以查看只读 trunk：

```bash
univer-example-cli open --unit "$UNIT_ID" --trunk
```

导出也是读取操作，因此必须显式选择 trunk 或 Worktree：

```bash
univer-example-cli export review.xlsx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

## 这是示例策略

本例规定 trunk 只用于查看，所有内容编辑必须进入 Worktree。这个规则由本 application 的 CLI 和 Web 界面表达，
不是 Collaboration SDK 或 CLI SDK 的强制限制。生产应用仍应根据自己的权限模型，通过 Server middleware 和 ACL
真正保护 trunk 写入。

## 交给 Agent 使用

保持 Server 运行，在另一个终端安装 skill：

```bash
pnpm skill:install
```

用 Agent 打开当前目录，然后输入：

```text
使用 univer-content 帮我在 Worktree 中创建一个销售表格，包含 10 条示例数据，完成后交给我审阅。
```

体验结束后运行：

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## 相比 03 增加了什么

新增文件：

- `src/cli/features/worktree.ts`：创建 Worktree，并将 draft 标记为 Ready。

改动文件：

- `src/server/server.ts`：增加 Worktree Service、Endpoint 和 SQLite Adapter。
- `src/cli/features/unit-content.ts`：inspect 可选择 target，execute 只接受 Worktree。
- `src/cli/features/unit.ts`、`file.ts` 与 `visual.ts`：open、export、screenshot 和 lint 可查看 trunk 或 Worktree。
- `src/shared/urls.ts`：Web URL 可以指向 trunk 或 Worktree。
- `src/web/`：trunk 只读，Worktree draft 可编辑，并提供 Ready、Reopen 和 Merge。
- `package.json`：增加 Worktree Client、Service、Endpoint 和 SQLite Adapter。
- `skills/univer-content/SKILL.md`：Agent 的修改与检查流程切换到 Worktree。
- `test/smoke.test.ts`：把继承的 smoke path 切换到 Worktree target。

其余内容继承 03。本例不增加 runtime pool、worker 或 daemon。
