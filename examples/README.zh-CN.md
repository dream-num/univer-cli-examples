# Examples

[English](./README.md) | 简体中文

这里的每个目录都是一个独立、可运行的应用，并且只使用 Univer CLI SDK 已发布的公共 API。
示例自行负责 application target、存储、presentation 和依赖组装；可复用 capability 仍由 SDK
package 提供。

| 示例 | 内容 |
| --- | --- |
| [`api-reference-cli`](./api-reference-cli/README.zh-CN.md) | 将 capability 及其原生 Commander preset 组装为完整 CLI |

建议从 `api-reference-cli` 开始；它不需要 license、浏览器、worker、daemon 或外部服务。
