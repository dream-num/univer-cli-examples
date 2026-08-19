# Examples

[English](./README.md) | 简体中文

这里的每个目录都是一个独立、可运行的应用，并且只使用 Univer CLI SDK 已发布的公共 API。
示例自行负责 application target、存储、presentation 和依赖组装；可复用 capability 仍由 SDK
package 提供。

| 示例 | 内容 |
| --- | --- |
| [`api-reference-cli`](./api-reference-cli/README.zh-CN.md) | 将 capability 及其原生 Commander preset 组装为完整 CLI |
| [`univer-mini-cli`](./univer-mini-cli/README.md) | 创建、导入、检查、编辑和导出本地 Sheet、Doc 与 Slide Unit |

建议从 `api-reference-cli` 理解最小接入，再用 `univer-mini-cli` 跑通完整本地 Office 工作流。
