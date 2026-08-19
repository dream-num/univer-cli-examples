# Univer CLI SDK 用户手册

[English](./README.md) | 简体中文

Univer CLI SDK 为构建 Univer CLI 应用提供 target-neutral capability、可选的 Commander command
预设和 runtime 基础设施。

接入时先按应用任务选择 capability package；只有需要默认 Commander 交互时，才增加对应的
`-command` package。应用仍然负责创建 root `Command`、通过 `addCommand()` 显式组装命令，以及
处理产品 target、存储、凭据和外部系统集成。

## 从这里开始

1. 按[快速开始](./quick-start.zh-CN.md)构建并运行第一个 CLI。
2. 阅读对应的[示例源码说明](../examples/api-reference-cli/README.zh-CN.md)。
3. 只有 application 出现具体需求时，再增加其他 capability。

本仓库当前锁定 release cohort `1.0.0-insiders.20260819-8595af2`。
