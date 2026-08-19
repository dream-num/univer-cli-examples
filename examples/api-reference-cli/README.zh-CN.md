# API Reference CLI

[English](./README.md) | 简体中文

这个示例组装了一个完整 CLI，用于离线搜索和查看 Univer Facade API。它展示了本仓库最小且
有实际用途的接入方式：

```text
application root Command
└── addCommand(api preset)
                  └── structured API reference capability
```

## 运行

在仓库根目录执行：

```bash
pnpm install
pnpm example:api-reference -- api find --unit sheet setValues
pnpm example:api-reference -- api show FRange.setValues
```

这个示例不需要 Univer runtime、license、浏览器、daemon 或外部服务。

## 源码结构

- [`src/program.ts`](./src/program.ts) 是 composition root，创建 capability 并把 preset 加入
  application 的原生 Commander program。
- [`src/index.ts`](./src/index.ts) 是进程边界，负责把失败映射为退出码。
- [`test/smoke.test.ts`](./test/smoke.test.ts) 调用构建后的真实 entrypoint 并验证输出。

## 自定义方式

`createApiCommand()` 返回原生 Commander `Command`，application 可以改名、增加 alias、配置输出，
也可以完全不使用 preset，直接调用 `reference.find()` 和 `reference.show()` 生成符合自身需求的
结构化输出。
