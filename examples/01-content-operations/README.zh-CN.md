# 01 Content Operations · 用 CLI 编辑协同文档

[English](./README.md) | 简体中文

这是 Univer CLI SDK 的第一个示例。你会在终端里创建一个表格，读取并修改其中的单元格，再用浏览器打开同一个表格，看到刚才提交的结果。CLI 和 Web 编辑器连接同一个本地协同服务，通过 Unit ID 打开同一份内容。除了表格（Sheet），这个 CLI 也支持文档（Doc）和演示文稿（Slide）。

## 启动示例

使用 Node.js 22.12 或更高版本和 pnpm 12.16.1。在 `examples/01-content-operations` 目录运行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

`link-cli` 注册本示例的 `univer-example-cli` 命令。服务启动后会打印 `http://127.0.0.1:3010`。保持该终端运行，在同一目录另开一个终端执行下面的命令。

## 向空白表格写入数据

创建一个名为 Demo 的空白表格，把输出的 Unit ID 存入变量，然后读取第一个工作表的前两行：

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Demo")
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$UNIT_ID" --json
```

此时 `A1:B2` 的四个单元格都是空的。用 `execute` 一次写入库存表的表头和第一条记录：

```bash
univer-example-cli execute --unit "$UNIT_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Item", "Quantity"], ["Apples", 2]])'
```

CLI 通过 Collaboration Runtime 加载表格、执行修改并提交。看到 `"commit": "confirmed"` 后，在浏览器中打开刚才的表格：

```bash
univer-example-cli open --unit "$UNIT_ID"
```

在 `Data` 工作表中应能看到 A2 为 `Apples`、B2 为 `2`。左侧文件列表可以切换到其他 Unit。服务把数据保存在 `.data/content-operations-demo.sqlite`，重启后仍可用原来的 ID 打开。

编写自己的修改命令时，可以用 CLI 查找 Facade 方法并查看用法：

```bash
univer-example-cli api find setValues --unit sheet
univer-example-cli api show FRange.setValues
```

## 让 Agent 使用同一个 CLI

保持服务运行，在示例目录执行 `pnpm skill:install`，再用 Agent 打开该目录，输入：

```text
使用 univer-content 帮我创建一个销售表格，包含 10 条示例数据。
```

随示例提供的 `univer-content` skill 指导 Agent 创建表格、写入数据，再用 `inspect` 读回结果。打开 Agent 返回的链接，就能在 Web 编辑器中查看这 10 条记录。

## 结束运行

在服务终端按 Ctrl+C。如果安装了 skill，运行 `pnpm skill:uninstall`。运行 `pnpm unlink-cli` 移除本示例注册的 CLI 命令。

本示例使用 Univer CLI SDK 和 Univer SDK 1.6.1。修改示例后，可在该目录运行 `pnpm check`。
