# 02 File Exchange · 导入和导出 Office 文件

[English](./README.md) | 简体中文

这个示例在 01 的内容操作基础上增加了 `export` 和 `import`。你会把一张销售表导出为本地 Excel 文件，再将它导入为一份新的协同表格，用 CLI 和浏览器核对数据。Office 文件由 CLI 在本地转换，协同服务保存导入的内容。

## 启动示例

使用 Node.js 22.12 或更高版本和 pnpm 12.16.1。在 `examples/02-file-exchange` 目录运行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

服务启动后会打印 `http://127.0.0.1:3010`。保持服务运行，在同一目录另开一个终端。

## 将表格导出为 Excel

创建一张空白表格，填入一月份的销售额，然后把已提交的内容导出到当前目录的 `sales.xlsx`：

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Sales")
univer-example-cli execute --unit "$UNIT_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Month", "Sales"], ["January", 120]])'
univer-example-cli export sales.xlsx --unit "$UNIT_ID"
```

## 导入文件并核对数据

```bash
IMPORTED_ID=$(univer-example-cli import sales.xlsx --name "Imported sales")
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$IMPORTED_ID" --json
univer-example-cli open --unit "$IMPORTED_ID"
```

导入会返回新的 Unit ID。检查输出的 `displayValues`，第二行应为 `["January", "120"]`。浏览器的文件列表中会同时出现原表 `Sales` 和导入的 `Imported sales`。两份表格独立保存，后续可以分别编辑。

同样的命令也支持 Doc（`.docx`）和 Slide（`.pptx`）。导入时由文件扩展名决定 Unit 类型，导出时使用与 Unit 类型对应的扩展名。

## 让 Agent 处理文件

在示例目录运行 `pnpm skill:install`，然后用 Agent 打开该目录。可以接着使用上面生成的 Excel 文件：

```text
使用 univer-content 导入 ./sales.xlsx，把一月份的销售额改成 1000，读回确认后导出为 ./updated-sales.xlsx。
```

完成后，在服务终端按 Ctrl+C。如果安装了 skill，运行 `pnpm skill:uninstall`。运行 `pnpm unlink-cli` 移除本示例注册的 CLI 命令。

本示例使用 Univer CLI SDK 和 Univer SDK 1.5.2。协同数据保存在 `.data/file-exchange-v2.sqlite`。修改示例后，可运行 `pnpm check`。
