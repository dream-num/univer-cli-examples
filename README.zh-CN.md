# Univer CLI SDK Examples

[English](./README.md) | 简体中文

本仓库提供 Univer CLI SDK 的公开用户手册和可运行示例。

## 仓库结构

- [`user-manual`](./user-manual/README.zh-CN.md) 是完整的 CLI SDK 接入手册。
- [`examples`](./examples/README.zh-CN.md) 存放只使用已发布公共 API 的独立应用。

## 环境要求

- Node.js 22.12 及以上版本
- pnpm 10
- CLI SDK package 仍位于 Insiders 发布通道期间，需要能够访问 Univer Insiders registry

每个示例都会锁定一组相互兼容的 release cohort，并单独说明所需 runtime、license 和外部服务。

## 快速开始

安装依赖并运行 API reference 示例：

```bash
pnpm install
pnpm example:api-reference -- api find --unit sheet setValues
pnpm example:api-reference -- api show FRange.setValues
pnpm example:univer-mini --help
```

这个示例在本地查询随 package 发布的 Univer Facade API reference，不会启动 Univer，也不需要
license 或在线文档服务。
