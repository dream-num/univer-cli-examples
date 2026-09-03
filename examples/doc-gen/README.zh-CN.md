# Doc Gen

[English](./README.md) | 简体中文

这个面向 agent 的示例使用 Typst 创作可编辑的本地 Univer Doc。Agent 为每个请求创建或修改独立的 Typst Source Bundle，编译源稿，在 headless Univer 中物化 Facade program，保存 Doc UnitData，并检查源侧和 Univer 侧两组 PNG。

## 设置示例

需要 Node.js 22.12 或更高版本，以及 pnpm 10.32.1。

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm link-cli
pnpm skill:install
```

用 Agent 打开此目录并要求它使用 `doc-gen`，例如：

```text
使用 doc-gen 创作一份两页的客户研究简报。源稿放在 authoring/customer-research，
生成产物放在 output/customer-research。
```

Agent 会创建源稿，不会修改仓库内置文档。如果你已有 bundle，请在请求中提供其目录或
`typst.json` 路径。

## Typst Source Bundle

调用者决定 bundle 路径。典型结构如下：

```text
authoring/customer-research/
├── typst.json
├── prelude.typ
├── pages/
│   ├── 01.typ
│   └── 02.typ
└── assets/
    └── diagram.svg
```

`typst.json` 声明 Local Doc Identity 和有序页面源文件：

```json
{
  "schemaVersion": 1,
  "targetUnitId": "customer-research",
  "title": "客户研究简报",
  "prelude": ["prelude.typ"],
  "pages": [
    { "id": "page-01", "source": "pages/01.typ" },
    { "id": "page-02", "source": "pages/02.typ" }
  ]
}
```

`schemaVersion`、`targetUnitId` 和 `pages` 必填；`title`、`prelude`、显式 page ID 和本地
`assets/` 可选。所有引用路径必须位于 bundle 内。bundle 是创作源；生成的 JavaScript、JSON 和
PNG 不是源稿。

`targetUnitId` 只在本地构建中连接 Typst Source Bundle 与 Materialized Doc。它不是 Workspace identity 或远程 Unit ID。

把任意 bundle 目录或 manifest 路径编译到独立输出目录：

```bash
doc-gen compile-typst <bundle-or-manifest> --out <output-directory> --json
```

## Generated Artifact

必填的 `--out` 目录包含：

| 路径               | 含义                                 |
| ------------------ | ------------------------------------ |
| `document.js`      | 从当前 bundle 生成的 Facade program  |
| `diagnostics.json` | 结构化 compiler diagnostics          |
| `document.json`    | 保存后的 Materialized Doc UnitData   |
| `typst/*.png`      | 用于检查源侧布局的 Typst Preview     |
| `univer/*.png`     | 用于检查转换结果的 Univer Screenshot |

命令只替换这些已知 artifact，保留输出目录中的其他文件。示例通过 Git 忽略 `/output/`。

在 `--json` 模式下，成功只向 stdout 写一个 Machine Result；失败只向 stderr 写一个 Machine Failure。error diagnostic 会在物化前停止；warning 允许成功，并保留在结果中供检查。

## 视觉检查

每次成功构建后都要读取两组 PNG：

1. 检查 Typst Preview 中的文本、层级、边距、换行和表格布局。
2. 检查 Univer Screenshot 中的相同内容、裁切、缺失 block 和转换差异。
3. 报告剩余 warnings。如果具备图像能力的模型无法读取任意一组图像，视觉验证保持 pending。

内置 `doc-gen` skill 固化了 bundle 创建、编译和检查流程。用以下命令安装或删除本地 symlink：

```bash
pnpm skill:install
pnpm skill:uninstall
```

## 运行边界

- Typst compile 支持已发布 native binding 的 macOS x64/arm64、Linux glibc x64/arm64 和 Windows x64；Linux musl 与 Windows arm64 不在本示例支持范围内。
- Univer Screenshot 需要 Chrome、Chromium 或 Edge。自动发现失败时设置 `UNIVER_RENDER_BROWSER`。
- compile/materialize/save 不强制要求 `UNIVER_LICENSE`。截图遵循 Pro render plugin 的 license 和 watermark 行为；空 license 可能产生水印。
- 命令只使用 package 自带的 Typst native binding，并只执行当前 compile 返回的 program；不会调用系统 Typst，也不接受已有 JavaScript program。
