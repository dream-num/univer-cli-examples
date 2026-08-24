# 03 Visual Inspection

[English](./README.md) | 简体中文

这个 example 完整保留 02 的内容操作与文件交换，只增加视觉检查：从 Server 拉取最新 UnitData，交给
browser-backed Render Runtime，并写出 PNG。

```text
02 File Exchange + Render Page + Screenshot → PNG
```

## 运行

进入本 example 后，所有命令都在当前目录执行：

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

另开终端，仍在当前目录创建 Unit，然后使用返回的 `unitId` 截图：

```bash
SHEET_ID=$(univer-example-cli create sheet --name "Visual Demo")
univer-example-cli screenshot --unit "$SHEET_ID" --sheet Data --range A1:B2 --out output
```

Doc 不传 Sheet selector；Slide 可以选择页码：

```bash
DOC_ID=$(univer-example-cli create doc --name "Visual Doc")
univer-example-cli screenshot --unit "$DOC_ID" --out output

SLIDE_ID=$(univer-example-cli create slide --name "Visual Slide")
univer-example-cli screenshot --unit "$SLIDE_ID" --pages 1 --out output
```

Slide 还可以顺带检查文字越界和重叠：

```bash
univer-example-cli lint --unit "$SLIDE_ID" --pages 1
```

体验结束后运行 `pnpm unlink-cli`。

02 中的 `create`、`import`、`export`、`inspect`、`execute`、`open` 和 `api` 命令保持不变。

## 相比 02 增加了什么

新增文件：

- `src/cli/features/visual.ts`：组装 screenshot 和 layout lint preset，拉取最新 UnitData，并写入 PNG。
- `src/render-page/index.html` 与 `src/render-page/main.ts`：Render Runtime 加载的最小浏览器页面。
- `vite.render.config.ts`：单独构建 Render Page。

改动文件：

- `src/cli/program.ts`：在 02 的 commands 后增加 `screenshot` 和 `lint`。
- `package.json`：增加视觉检查与渲染依赖，并构建第二个页面。
- `skills/univer-content/SKILL.md`：Agent 完成内容校验后增加视觉确认。
- `test/smoke.test.ts`：保留前序的三种 Unit smoke path，再验证生成的 PNG。

其余 `src/cli/features/`、`src/server/`、`src/shared/` 和 `src/web/` 保留 02 的能力。

运行 `pnpm check` 验证当前 example。

Layout lint 当前只支持 Slide。Finding 是审阅依据，不要求一律清零。
