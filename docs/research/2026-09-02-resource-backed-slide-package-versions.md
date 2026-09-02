# Resource-backed Slide 包版本可用性

- 调研日期：2026-09-02
- 窄问题：`06-resource-backed-slide` 所需的 SVG compiler、Resource Library 和默认资源包是否已公开发布，示例能否继续使用现有 `1.0.0-beta.2` Univer 队列？
- 核验方式：对 npm 官方 registry 发起无凭证请求，下载 registry 返回的 tarball 并检查其 `package.json`、README 和类型声明；对照第一方 application 源码。

## 结论

五个所需 package 都已公开发布且可以无凭证安装：四个 `@univer-cli/*` package 的公开版本均为 `1.0.0-beta.2`，`@univerjs-pro/cli-assets` 的公开版本为 `0.1.0`。`06-resource-backed-slide` 可以保持现有 `1.0.0-beta.2` Univer 队列，无需整组切换到 insiders。

`1.0.0-insiders.20260831-796c4f4` 不在这四个 `@univer-cli/*` package 的公开 registry metadata 中，对精确版本 endpoint 的无凭证请求均返回 HTTP 404。第一方 application 源码虽然引用该 insiders 队列，但它不能作为公开可安装性的依据。[application package manifest](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/package.json#L44-L84)

## Registry 证据

| Package | 公开版本 | tarball 包清单的版本约束 |
|---|---|---|
| `@univer-cli/svg-facade` | [`1.0.0-beta.2` metadata](https://registry.npmjs.org/%40univer-cli%2Fsvg-facade/1.0.0-beta.2) / [tarball](https://registry.npmjs.org/@univer-cli/svg-facade/-/svg-facade-1.0.0-beta.2.tgz) | 无 dependency 或 peer dependency |
| `@univer-cli/svg-facade-command` | [`1.0.0-beta.2` metadata](https://registry.npmjs.org/%40univer-cli%2Fsvg-facade-command/1.0.0-beta.2) / [tarball](https://registry.npmjs.org/@univer-cli/svg-facade-command/-/svg-facade-command-1.0.0-beta.2.tgz) | 精确依赖 `@univer-cli/svg-facade@1.0.0-beta.2`；peer 为 `commander@^15.0.0` |
| `@univer-cli/resource-library` | [`1.0.0-beta.2` metadata](https://registry.npmjs.org/%40univer-cli%2Fresource-library/1.0.0-beta.2) / [tarball](https://registry.npmjs.org/@univer-cli/resource-library/-/resource-library-1.0.0-beta.2.tgz) | 无 dependency 或 peer dependency |
| `@univer-cli/resource-library-command` | [`1.0.0-beta.2` metadata](https://registry.npmjs.org/%40univer-cli%2Fresource-library-command/1.0.0-beta.2) / [tarball](https://registry.npmjs.org/@univer-cli/resource-library-command/-/resource-library-command-1.0.0-beta.2.tgz) | 精确依赖 `@univer-cli/resource-library@1.0.0-beta.2`；peer 为 `commander@^15.0.0` |
| `@univerjs-pro/cli-assets` | [`0.1.0` metadata](https://registry.npmjs.org/%40univerjs-pro%2Fcli-assets/0.1.0) / [tarball](https://registry.npmjs.org/@univerjs-pro/cli-assets/-/cli-assets-0.1.0.tgz) | 无 dependency 或 peer dependency；导出 `./manifest.json` |

所有 metadata 与 tarball URL 在清空 `Authorization` header 后均返回 HTTP 200。四个 `@univer-cli/*` package 的完整 metadata 各自只列出 `1.0.0-beta.2`：[svg-facade](https://registry.npmjs.org/%40univer-cli%2Fsvg-facade)、[svg-facade-command](https://registry.npmjs.org/%40univer-cli%2Fsvg-facade-command)、[resource-library](https://registry.npmjs.org/%40univer-cli%2Fresource-library)、[resource-library-command](https://registry.npmjs.org/%40univer-cli%2Fresource-library-command)。相应 insiders 精确版本 endpoint 均为 404：[svg-facade](https://registry.npmjs.org/%40univer-cli%2Fsvg-facade/1.0.0-insiders.20260831-796c4f4)、[svg-facade-command](https://registry.npmjs.org/%40univer-cli%2Fsvg-facade-command/1.0.0-insiders.20260831-796c4f4)、[resource-library](https://registry.npmjs.org/%40univer-cli%2Fresource-library/1.0.0-insiders.20260831-796c4f4)、[resource-library-command](https://registry.npmjs.org/%40univer-cli%2Fresource-library-command/1.0.0-insiders.20260831-796c4f4)。

## 与现有 beta.2 队列的兼容性

这些 package 的发布清单没有引入任何 insiders 或不同版本的 `@univerjs/*` / `@univerjs-pro/*` dependency。两个 command package 只绑定同队列的 facade/library package 和 `commander@^15.0.0`，而现有 [`04-worktree/package.json`](../../examples/04-worktree/package.json) 已使用 `commander@^15.0.0` 和统一的 Univer `1.0.0-beta.2` 队列。因此，从包版本与 peer resolution 看，`06` 只需添加表中五个精确版本。

无凭证 `npm install --dry-run` 也同时解析了上述五个 package、`@univerjs/core@1.0.0-beta.2`、`@univerjs-pro/slides@1.0.0-beta.2` 和 `commander@^15.0.0`，无 peer 或版本冲突。

## 实现时的 API 约束

public beta.2 tarball 已导出 `createCompileSvgCommand`、`createResourcesCommand`、`createNodeResourceLibraryFactory` 和 `builtinTextMeasurer`，并支持所需的 `compile-svg --page ... --out ... --estimate-text-size --json` 以及 `resources find/export` 命令。因此教学闭环本身可以在 beta.2 实现。[SVG command tarball](https://registry.npmjs.org/@univer-cli/svg-facade-command/-/svg-facade-command-1.0.0-beta.2.tgz) [Resource command tarball](https://registry.npmjs.org/@univer-cli/resource-library-command/-/resource-library-command-1.0.0-beta.2.tgz)

beta.2 的 command factory 签名与当前 insiders application 源码不同：beta.2 要求 `createCompileSvgCommand({ textMeasurer })`，而当前源码传入 `createTextMeasurer` 和 `unitContent`。实现 `06` 时应按 beta.2 tarball 的类型声明传入 `builtinTextMeasurer`，不能原样复制 insiders 的 composition 调用。[first-party insiders composition](https://github.com/dream-num/univer-cli/blob/ef561767ec8e75dc583326e7b26ace5c1cb98554/apps/cli/src/program.ts#L250-L272)

## 规划决定

版本门槛已解除：`06-resource-backed-slide` 保持 beta.2 队列，新增四个 `@univer-cli/*@1.0.0-beta.2` 和 `@univerjs-pro/cli-assets@0.1.0`。不采用公开 registry 中不存在的 `1.0.0-insiders.20260831-796c4f4`。
