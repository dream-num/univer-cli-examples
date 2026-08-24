# Univer CLI Examples

[English](./README.md) | 简体中文

这个仓库只存放可运行的 Univer CLI SDK 教学 examples。概念和架构说明统一在
[Univer Office 文档站](https://office.univer.ai/zh-CN/cli/overview)维护。

| Example                                                                     | 学习目标                           | 新增概念                                |
| --------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| [`01-content-operations`](./examples/01-content-operations/README.zh-CN.md) | 读取、修改并查看 Sheet、Doc、Slide | CLI、Server、Web、Collaboration Runtime |
| [`02-visual-inspection`](./examples/02-visual-inspection/README.zh-CN.md)   | 为 01 的三种 Unit 生成截图         | Render Page、Render Runtime             |

请按编号阅读。每个目录都有自己的 `package.json`、lockfile 和依赖，可以独立复制和运行。

## 01 Content Operations

```bash
cd examples/01-content-operations
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Server 启动后，在同一个目录的另一个终端安装 skill：

```bash
pnpm skill:install
```

用 Agent 打开 `01-content-operations` 目录，然后输入：

```text
使用 univer-content 帮我创建一个销售表格，包含 10 条示例数据。
```

## 02 Visual Inspection

```bash
cd examples/02-visual-inspection
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

另开终端，仍在 `02-visual-inspection` 目录：

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Visual Demo")
univer-example-cli screenshot --unit "$UNIT_ID" --sheet Data --range A1:B2 --out output
```

完整命令和验证方式见各 example 的 README。

这些 examples 是最小教学装配，不是生产应用。登录、权限、Worktree、Daemon 和文件交换会在各自需要它们的后续
example 中出现。
