# univer-mini-cli

[English](./README.md) | 简体中文

一个面向 Agent 的最小本地 Office CLI example。它把 Univer CLI SDK capability 与 Univer Pro 文件导入导出
组合为完整工作流：

```text
create / import -> inspect -> api find / show -> execute -> export
```

它支持创建、导入、检查和编辑 Sheet、Doc 与 Slide，并分别导出 XLSX/CSV/TSV、DOCX 和 PPTX。所有业务结果默认输出
JSON，失败使用非零退出码并向 stderr 写入 JSON error。

## 示例定位

这是一个刻意保持最小的教学 example，不是完整产品 CLI。它只保留 Agent 完成真实 Office 内容任务所需的最小闭环，
使用本地 `*.unit.json` 持久化内容，并为每次需要内容 runtime 的命令创建独立 Univer instance。这样的设计便于阅读、
复制和理解 package 组合方式，但不解决高频调用性能、并发编辑、历史版本、远程协同或视觉验收问题。

## 运行要求

- Node.js `>=22.12.0`
- pnpm
- 与当前 Univer packages 兼容的 Univer / Univer Pro license

License 通过环境变量提供：

```bash
export UNIVER_LICENSE="..."
```

在仓库根目录构建后，通过 workspace script 运行：

```bash
pnpm --filter @univer-cli-example/univer-mini-cli build
pnpm --filter @univer-cli-example/univer-mini-cli start:built --help
```

安装 package 的 bin link 后，也可以直接使用下面示例中的 `univer-mini`。

## 完整工作流

创建一个本地 Sheet Unit：

```bash
univer-mini create sheet ./report.unit.json --name "Quarterly report"
```

也可以从 Office 文件开始。输入类型由扩展名推断：

```bash
univer-mini import ./source.xlsx ./report.unit.json
univer-mini import ./proposal.docx ./proposal.unit.json
univer-mini import ./deck.pptx ./deck.unit.json
```

先检查结构化内容：

```bash
univer-mini inspect ./report.unit.json workbook
univer-mini inspect ./report.unit.json worksheet name:Plan
univer-mini inspect ./report.unit.json range A1:F20 --worksheet name:Plan
univer-mini inspect ./proposal.unit.json document
univer-mini inspect ./deck.unit.json presentation
```

不确定 Facade API 时，离线查询当前 Univer SDK reference：

```bash
univer-mini api find "conditional formatting" --unit sheet
univer-mini api show FRange.setValues
```

执行 Facade JavaScript。Runtime 会提供与 Unit 类型对应的稳定 binding：Sheet 使用 `workbook`，Doc 使用
`doc`，Slide 使用 `presentation`；三者都提供 `univerAPI` 和 `api`。

```bash
univer-mini execute ./report.unit.json \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([[1, 2], [3, 4]])'
```

较长任务放入文件，避免 shell quoting：

```bash
univer-mini execute ./deck.unit.json --file ./scripts/build-deck.js
```

只有 execution 完整成功后才会原子替换本地 Unit 文件。随后导出交付文件：

```bash
univer-mini export ./report.unit.json ./report.xlsx
univer-mini export ./proposal.unit.json ./proposal.docx
univer-mini export ./deck.unit.json ./deck.pptx
```

## 本地 Unit 文件

`*.unit.json` 是这个 application 自己拥有的持久化格式，不是 Univer CLI SDK 的公共合同。它使用带版本的 envelope
保存 Unit 类型与完整 UnitData：

```json
{
  "format": "univer-mini/local-office-unit",
  "version": 1,
  "unitType": "sheet",
  "data": {}
}
```

每条内容命令都会为该文件创建短生命周期的 headless runtime，通过 Univer 的公开 `createUnit()` 加载数据，并在
`finally` 中关闭。这个 example 不需要 daemon、worker pool、协同 runtime、协同 server 或远程 Workspace。

## 安全与边界

`execute` 使用 JavaScript `Function` 执行输入，它不是安全沙箱，只能运行可信代码。Application 负责本地路径、文件格式、
JSON presentation 和 runtime 生命周期；内容执行、inspection 和 API reference 使用 Univer CLI SDK capability，
Office 文件导入导出直接使用 Univer Pro 的 `@univerjs-pro/exchange-node` package。

## 下一步

1. **性能与生命周期**：结合 `@univer-cli/daemon` 和 keyed instance pool，在多个短生命周期 CLI 进程之间复用
   headless Univer runtime，减少连续 `inspect`、`execute` 时的初始化开销，并补充 idle eviction、instance
   invalidation 与 daemon shutdown。
2. **版本控制与协同**：结合 Univer Collaboration SDK 和 `@univer-cli/univer-collaboration-runtime`，把当前本地
   UnitData 文件升级为 Snapshot、changeset、revision、OT 与 Worktree 驱动的编辑流程，再按并发规模接入
   `@univer-cli/univer-collaboration-runtime-pool`。
3. **视觉验收与高级能力**：集成 `@univer-cli/unit-screenshot`、`@univer-cli/unit-layout-lint` 和 render runtime，
   让 Agent 能截图、检查 Slide layout 并形成“编辑—渲染—检查—修正”循环；还可以继续组合 SVG/Typst compiler、
   resource library 等高级内容能力。
