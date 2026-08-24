# 02 Visual Inspection

[English](./README.md) | 简体中文

这个 example 完整保留 01 基于 SQLite 的 Sheet、Doc、Slide Server、Web 文件侧边栏和 CLI 主链路，只增加截图
能力：从 Server 拉取最新 UnitData，交给 browser-backed Render Runtime，最后写出 PNG。

```text
01 Content Operations + Render Page + Screenshot → PNG
```

## 运行

进入本 example 后，所有命令都在当前目录执行：

```bash
pnpm install
pnpm build
pnpm server
```

另开终端，仍在当前目录创建 Unit，然后使用返回的 `unitId` 截图：

```bash
pnpm start create sheet --name "Visual Demo"
pnpm start screenshot --unit <unit-id> --sheet Data --range A1:B2 --out output
```

Doc 不传 Sheet selector；Slide 可以选择页码：

```bash
pnpm start screenshot --unit <doc-id> --out output
pnpm start screenshot --unit <slide-id> --pages 1 --out output
```

01 中的 `create`、`inspect`、`execute`、`open` 和 `api` 命令保持不变。

## 相比 01 增加了什么

新增文件：

- `src/cli/features/visual.ts`：组装 screenshot preset，拉取最新 UnitData，并写入 PNG。
- `src/render-page/index.html` 与 `src/render-page/main.ts`：Render Runtime 加载的最小浏览器页面。
- `vite.render.config.ts`：单独构建 Render Page。

改动文件：

- `src/cli/program.ts`：在 01 的 commands 后增加 `screenshot`。
- `package.json`：增加 screenshot、Render Runtime 和 Render Page 依赖，并构建第二个页面。
- `skills/univer-content/SKILL.md`：Agent 完成内容校验后增加视觉确认。
- `test/smoke.test.ts`：保留 01 的三种 Unit smoke path，再验证生成的 PNG。

其余 `src/cli/features/`、`src/server/`、`src/shared/` 和 `src/web/` 与 01 保持一致。

运行 `pnpm check` 验证当前 example。

本例只增加 screenshot。Layout lint 继续留给后面的教学步骤。
