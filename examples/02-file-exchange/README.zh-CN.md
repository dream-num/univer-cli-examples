# 02 File Exchange

[English](./README.md) | 简体中文

这个 example 基于 01，在同一个 CLI、Web 和 Server 上增加 Office 文件导入导出。Exchange 在 CLI 进程中
读取或写入本地文件，导入后的 Unit 仍由 Collaboration Server 保存，Web 可以直接打开。

```text
Office 文件 ⇄ CLI Exchange ⇄ UnitData ⇄ Collaboration Server ⇄ Web
```

## 运行

进入本 example 后，所有命令都在当前目录执行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

另开终端，仍在当前目录操作。下面的流程不需要提前准备 Office 文件：先创建一个 Sheet 并导出，再把导出的
文件作为新的协同 Unit 导入。

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Exchange Demo")

univer-example-cli export demo.xlsx --unit "$UNIT_ID"

IMPORTED_ID=$(univer-example-cli import demo.xlsx --name "Imported Demo")

univer-example-cli inspect workbook --unit "$IMPORTED_ID" --json
univer-example-cli open --unit "$IMPORTED_ID"
```

Sheet 使用 `.xlsx`，Doc 使用 `.docx`，Slide 使用 `.pptx`。输入扩展名决定导入的 Unit 类型；导出文件扩展名
必须与 Unit 类型匹配。

## 交给 Agent 使用

保持 Server 运行，在另一个终端安装 skill：

```bash
pnpm skill:install
```

用 Agent 打开当前目录，然后输入：

```text
使用 univer-content 导入 ./sales.xlsx，把第二行的销售额改成 1000，验证后导出为 ./updated-sales.xlsx。
```

体验结束后运行：

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## 相比 01 增加了什么

- `src/cli/features/file.ts` 增加 `import` 和 `export` 两个 application command。
- `import` 使用 `@univerjs-pro/exchange-node` 将 Office 文件转换为 UnitData，再通过现有 Server API 创建 Unit。
- `export` 使用 Collaboration Runtime 取得最新 UnitData，再写成 Office 文件。
- Server 的创建接口可以接收空白 Unit 参数或已经转换完成的 UnitData。
- 增加 `@univerjs-pro/exchange-node-binding`，为当前平台提供原生文件转换实现。

文件交换没有额外的 CLI SDK preset；`file.ts` 是业务 application 在 Commander 中组合 Exchange 与
Collaboration Runtime 的最小 adapter。它没有上传服务、异步转换任务、远程 URL、进度、重试或文件管理。

数据写入 `.data/file-exchange.sqlite`。运行 `pnpm check` 验证当前 example。
