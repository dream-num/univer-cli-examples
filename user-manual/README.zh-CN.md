# Univer CLI SDK 用户手册

[English](./README.md) | 简体中文

Univer CLI SDK 为构建 Univer CLI 应用提供 target-neutral capability、可选的 Commander command
预设和 runtime 基础设施。

接入时先按应用任务选择 capability package；只有需要默认 Commander 交互时，才增加对应的
`-command` package。应用仍然负责创建 root `Command`、通过 `addCommand()` 显式组装命令，以及
处理产品 target、存储、凭据和外部系统集成。

后续会随可运行示例和已发布、已验证的 release cohort 一起补充具体集成章节。
