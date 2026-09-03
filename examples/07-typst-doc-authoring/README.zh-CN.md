# Typst Doc 创作

[English](./README.md)

本示例把受版本控制的 Typst Source Bundle 转换为可编辑的本地 Univer Doc。一个命令完成源稿编译、在 headless Univer 中物化 Facade program、保存 Doc UnitData，并渲染源侧和 Univer 侧两组 PNG 证据。

## 运行示例

需要 Node.js 22.12 或更高版本，以及 pnpm 10.32.1。

```bash
pnpm install --frozen-lockfile
pnpm build
node dist/cli/main.js compile-typst paper --out output --json
```

重新构建前，只编辑这些创作文件：

- `paper/typst.json`：标题、Local Doc Identity（`targetUnitId`）、prelude 和页面顺序。
- `paper/prelude.typ`：页面尺寸、字体、间距、颜色、页眉和页脚。
- `paper/pages/brief.typ`：简报内容与布局。

`targetUnitId` 只在本地构建中连接 Typst Source Bundle 与 Materialized Doc。它不是 Workspace identity 或远程 Unit ID。

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

内置 `univer-content` skill 固化了这套流程。用以下命令安装或删除本地 symlink：

```bash
pnpm skill:install
pnpm skill:uninstall
```

## 运行边界

- Typst compile 支持已发布 native binding 的 macOS x64/arm64、Linux glibc x64/arm64 和 Windows x64；Linux musl 与 Windows arm64 不在本示例支持范围内。
- Univer Screenshot 需要 Chrome、Chromium 或 Edge。自动发现失败时设置 `UNIVER_RENDER_BROWSER`。
- compile/materialize/save 不强制要求 `UNIVER_LICENSE`。截图遵循 Pro render plugin 的 license 和 watermark 行为；空 license 可能产生水印。
- 命令只使用 package 自带的 Typst native binding，并只执行当前 compile 返回的 program；不会调用系统 Typst，也不接受已有 JavaScript program。
