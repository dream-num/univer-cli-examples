# 03 Visual Inspection · 检查文档的渲染效果

[English](./README.md) | 简体中文

这个示例在 02 的文件导入导出基础上增加了视觉检查。你会用 CLI 向空白表格写入两行数据，读回单元格的值，再截取同一区域，查看文字和数字在工作表里的实际显示效果。`screenshot` 会读取协同服务上已提交的内容，用本地浏览器渲染并保存为 PNG。

## 启动示例

使用 Node.js 22.12 或更高版本、pnpm 12.16.1，以及本机可用的 Chrome、Chromium 或 Edge。在 `examples/03-visual-inspection` 目录运行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

服务启动后会打印 `http://127.0.0.1:3010`。保持服务运行，在同一目录另开一个终端。

## 截取一块表格区域

创建销售表，在 `Data` 工作表中写入表头和一月份的销售额：

```bash
SHEET_ID=$(univer-example-cli create sheet --name "Sales")
univer-example-cli execute --unit "$SHEET_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Month", "Sales"], ["January", 120]])'
```

看到 `"commit": "confirmed"` 后，读取刚写入的区域，并将它保存为图片：

```bash
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$SHEET_ID" --json
univer-example-cli screenshot --unit "$SHEET_ID" --sheet Data --range A1:B2 --out output/sheet
```

检查输出的 `displayValues`，第二行应为 `["January", "120"]`。打开 `screenshot` 输出的 PNG 路径，确认表头和第二行的内容都可见，文字没有被裁切。需要在编辑器里调整时，运行 `univer-example-cli open --unit "$SHEET_ID"`。

## 检查 Doc 和 Slide

如果手头有 Word 文档或 PowerPoint 演示文稿，也可以先导入自己的文件。以下命令中的文件名替换为本地路径：

```bash
DOC_ID=$(univer-example-cli import report.docx)
univer-example-cli screenshot --unit "$DOC_ID" --out output/doc

SLIDE_ID=$(univer-example-cli import slides.pptx)
univer-example-cli screenshot --unit "$SLIDE_ID" --pages 1 --out output/slide
univer-example-cli lint --unit "$SLIDE_ID" --pages 1
```

Doc 按页截图。Slide 可以通过 `--pages` 指定页码；上例截取第 1 页，再用 `lint` 检查这一页的文字越界和元素重叠。结合 PNG 判断报告指出的位置是否需要调整。

## 让 Agent 检查截图

在示例目录运行 `pnpm skill:install`，再用支持图片输入的 Agent 打开该目录，输入：

```text
使用 univer-content 创建一张有 10 条销售记录的表格。读回数据，截取包含表头和 10 条记录的区域，打开 PNG 检查文字有没有被裁切。
```

完成后，在服务终端按 Ctrl+C。如果安装了 skill，运行 `pnpm skill:uninstall`，再用 `pnpm unlink-cli` 移除本示例注册的 CLI 命令。

本示例使用 Univer CLI SDK 和 Univer SDK 1.5.2。协同数据保存在 `.data/visual-inspection-demo.sqlite`。修改示例后，可运行 `pnpm check`。
