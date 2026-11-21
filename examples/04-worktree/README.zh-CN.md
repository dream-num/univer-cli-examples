# 04 Worktree · 审阅草稿并合入主线

[English](./README.md) | 简体中文

这个 example 完整保留 03 的文件交换与视觉检查，只增加 Worktree：Agent 在隔离 draft 中修改，标记
Ready 后由人通过 Web 审阅，再选择 Merge、Reopen 或 Discard。

```text
Trunk（Web 可编辑）→ Worktree draft（可编辑）→ Ready → Web 审阅 → Merge / Reopen / Discard
```

## 启动示例

使用 Node.js 22.12 或更高版本和 pnpm 12.16.1。在 `examples/04-worktree` 目录运行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

保持服务运行，在同一目录另开终端，创建一张空白销售表和对应的 Worktree：

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Sales")
WORKTREE_ID=$(univer-example-cli worktree create --unit "$UNIT_ID")
```

## 编辑草稿并对比主线

在草稿中写入两行数据，再分别读取草稿和主线的同一区域：

```bash
univer-example-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Month", "Sales"], ["January", 120]])'

univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$UNIT_ID" --trunk --json
```

草稿中一月的销售额为 120，主线中的这四个单元格仍为空。本例的 CLI 在 Worktree 中执行编辑；读取、截图和导出时可以选择草稿或主线。要把草稿导出为 Excel 文件供审阅，运行：

```bash
univer-example-cli export review.xlsx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

## 审阅并合入

将草稿标记为 Ready，在网页编辑器中打开：

```bash
univer-example-cli worktree ready "$WORKTREE_ID"
univer-example-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

Ready 状态下的草稿只读。选择 **Merge** 将修改合入主线，选择 **Reopen** 重新编辑草稿，或选择 **Discard** 放弃草稿。合入后，打开主线即可看到刚才写入的两行数据：

```bash
univer-example-cli open --unit "$UNIT_ID" --trunk
```

网页编辑器也允许直接编辑主线。应用可以通过服务端 middleware 和访问控制来限制主线的写入权限。

## 交给 Agent 使用

运行 `pnpm skill:install`，用 Agent 打开当前目录，然后输入：

```text
在 Worktree 中创建一张包含 10 条记录的销售表，核对数据后标记为 Ready，把草稿交给我审阅。
```

体验结束后，在服务终端按 Ctrl+C。若安装了 skill，运行 `pnpm skill:uninstall`。运行 `pnpm unlink-cli` 移除本例的 CLI 命令。

本示例使用 Univer CLI SDK 和 Univer SDK 1.6.0。主线和 Worktree 数据保存在 `.data/worktree-demo.sqlite`。
