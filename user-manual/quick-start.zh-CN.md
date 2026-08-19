# 快速开始

[English](./quick-start.md) | 简体中文

这个 Quick Start 会构建一个完整的 Commander application，用于离线查询 Univer Facade API
reference。

## 运行

准备 Node.js 22.12 及以上版本和 pnpm 10，然后在仓库根目录执行：

```bash
pnpm install
pnpm example:api-reference -- api find --unit sheet setValues
```

结果应包含 `FRange.setValues`。继续查看该 symbol 的精确信息：

```bash
pnpm example:api-reference -- api show FRange.setValues
```

## 组装了什么

Application 自行创建 root Commander `Command`，创建结构化 API reference capability，再通过
`addCommand()` 加入可选 command preset：

```ts
const program = new Command("univer-api");
program.addCommand(
  createApiCommand({
    reference: createStandardApiReference(),
  }),
);
```

`@univer-cli/api-reference` 负责搜索和 symbol 查询；可选的
`@univer-cli/api-reference-command` 负责默认 `api find` 和 `api show` 终端交互。Application
仍然拥有 root command 和顶层失败处理。

源码结构和测试见[完整示例](../examples/api-reference-cli/README.zh-CN.md)。
