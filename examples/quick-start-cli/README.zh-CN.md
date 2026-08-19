# Quick Start CLI

[English](./README.md) | 简体中文

这个示例没有实际产品意义，唯一目的就是说明 Univer CLI SDK application 的最小完整组装：

```text
application root Command
└── addCommand(api preset)
                  └── structured API reference capability
```

选择 API reference 查询，是因为它不需要 Univer runtime、license、浏览器、daemon 或外部服务。
查询能力本身不是这个示例的重点。

## 运行

在仓库根目录执行：

```bash
pnpm install
pnpm example:quick-start -- api find --unit sheet setValues
pnpm example:quick-start -- api show FRange.setValues
```

## 只需要读什么

- [`src/program.ts`](./src/program.ts) 是 composition root，创建一个 capability，并把对应 preset
  加入原生 Commander program。
- [`src/index.ts`](./src/index.ts) 是进程边界，负责把失败映射为退出码。
- [`test/smoke.test.ts`](./test/smoke.test.ts) 调用构建后的真实 entrypoint，证明这套最小组装可以运行。

需要有实际端到端工作流的示例时，请使用
[`univer-mini-cli`](../univer-mini-cli/README.zh-CN.md)。
