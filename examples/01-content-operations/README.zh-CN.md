# 01 Content Operations

[English](./README.md) | 简体中文

第一个 example 用最小装配展示完整内容操作闭环：启动 Server，创建 Sheet、Doc 或 Slide，通过 CLI 读取、修改和
提交，最后用 Web 打开同一个协同 Unit。

Web 页面左侧提供一个简单的文件列表，可以新建和切换已经持久化的 Units。

```text
CLI ──┐
      ├── Collaboration Server ── SQLite Adapter
Web ──┘
```

## 运行

进入本 example 后，所有命令都在当前目录执行：

```bash
pnpm install
pnpm build
pnpm server
```

另开终端，仍在当前目录操作：

```bash
pnpm start create sheet --name "Demo"

pnpm start inspect range A1:B2 --worksheet index:1 \
  --unit <unit-id> --json

pnpm start execute --unit <unit-id> \
  --code 'workbook.getActiveSheet().getRange("A2:B2").setValues([["Updated", 2]])'

pnpm start open --unit <unit-id>

# Agent 在生成执行代码前查询 Facade API
pnpm start api find setValues --unit sheet
pnpm start api show FRange.setValues
```

## 交给 Agent 使用

保持 Server 运行，在另一个终端安装 skill：

```bash
pnpm skill:install
```

用 Agent 打开当前目录，然后输入：

```text
使用 univer-content 帮我创建一个销售表格，包含 10 条示例数据。
```

Agent 会创建、填充、提交和校验 Unit，并返回 Web 地址。Skill 源码位于
`skills/univer-content/SKILL.md`，不参与 application 构建。体验结束后运行：

```bash
pnpm skill:uninstall
```

## 源码顺序

先读 `src/server/main.ts`、`src/server/server.ts` 和 `src/server/unit-store.ts`，再阅读 features：
`unit.ts` 放 `create/open`，`unit-content.ts` 放 `inspect/execute` 及其 collaboration runtime，`api.ts`
放 Facade API commands。最后阅读 `src/cli/program.ts` 和 `src/web/`。`inspect` 与 `api` 直接使用 CLI SDK
的 Commander preset；其他 command 是 application 自己的薄封装。

运行 `pnpm check` 验证当前 example。

这个 example 支持 Sheet、Doc、Slide，使用 SQLite 持久化和一个 demo user。数据写入
`.data/content-operations.sqlite`。它不处理登录、权限、冲突重试、备份、migration 或 Worktree。
