# 更新 SDK 操作指南

> **适用范围声明：本文档只描述本仓库（univer-cli-examples）的内部工作流，供维护者
> 升级 Univer SDK 依赖时使用。它不是给外部读者学习的 example，也不代表 Univer CLI
> 的推荐用法。** 仓库结构和可分发性规则见 [README](../README.md)。

## 背景

- 本仓库每个 example 用**精确版本** pin `@univer-cli/*`、`@univerjs/*`、`@univerjs-pro/*`，
  各自持有独立 lockfile（根 `pnpm-workspace.yaml` 里 `sharedWorkspaceLockfile: false`）。
- SDK 新版本先发布到 insider registry（`insider-npm-registry.univer.work`），验证通过并
  合入 main 后，再提升（promote）到公开 npm。insider 与公开 npm 上同名同版本的
  tarball **哈希一致**，lockfile 只记录 integrity 哈希与 npmjs tarball 路径，因此提升后
  **lockfile 不需要任何改动**。
- 根 `.npmrc` 只在验证期临时指向 insider。CI 合入门禁（`Merge gate - private registry`）
  会在私有 registry 被提交时报错并阻止合入，报错即提示"合入主分支之前，必须把所有
  NPM 包提升到公开 npm，并移除私有 registry 配置"。
  （需要一次性把该 job 设为分支保护 required check。）

## 操作步骤

以下以"从 1.2.0 升级到 1.3.1"为例。

### 1. 确认 insider 上可用

```bash
curl -s https://insider-npm-registry.univer.work/@univerjs/core | jq -r '.versions | keys | last'
```

### 2. 建分支

从最新 `origin/main` 建升级分支，例如 `codex/upgrade-examples-sdk-1.3.1`。

### 3. 升级版本 pin

把全部 example `package.json` 里 `@univer-cli/*`、`@univerjs/*`、`@univerjs-pro/*` 的精确
版本统一替换为新版本（不要用 `^` 范围），同步更新各 example README（中英双语）中的
"uses Univer CLI SDK and Univer SDK `x.y.z`" 文本。

### 4. 临时恢复 insider `.npmrc`

根目录 `.npmrc`（该文件平时不在 main 上）：

```
@univer-cli:registry=https://insider-npm-registry.univer.work/
@univerjs:registry=https://insider-npm-registry.univer.work/
@univerjs-pro:registry=https://insider-npm-registry.univer.work/
```

pnpm 会把根 `.npmrc` 继承给所有 example，不需要（也不允许）在每个 example 里再放一份。

### 5. 重新生成 lockfile 并验证

```bash
cd examples/<每个 example>
pnpm install          # 重新生成 pnpm-lock.yaml
pnpm check            # format + lint + typecheck + build + test
```

逐个 example 跑 `check`；lockfile 只会包含 npmjs tarball 路径 + integrity 哈希，
不应出现 insider URL（可用 `grep insider examples/*/pnpm-lock.yaml` 确认为 0）。

### 6. 建 PR

PR 里 4 个 `Check` job 会用 insider registry 完成 SDK 验证，应全绿；
`Merge gate - private registry` 此时为红，**这是设计如此**——它表示"私有 registry
还在仓库里，未到可合入状态"。

### 7. 提升到公开 npm

请维护者把本次涉及的所有包提升到公开 npm（insider 与公开的 tarball 哈希一致）。

### 8. 提升后核验并移除 `.npmrc`

1. 逐包核验哈希：公开 npm 上 `dist.integrity` 与 lockfile 里的 `integrity` 一致；
2. `git rm .npmrc`，然后在至少一个 example 里 `rm -rf node_modules && pnpm install
   --frozen-lockfile`——现在完全走公开 npm，安装成功即哈希复验通过；
3. push 后 CI 应**全绿**（4 个 Check + Merge gate），PR 就绪，合入。

## 常见问题

- **为什么不用 `workspace:*`？** 会破坏 example 拷出独立安装的能力。本仓库禁止。
- **为什么 `minimumReleaseAgeExclude` 放行 `@univer*`？** pnpm 12 默认拒绝安装发布
  未满 24 小时的包，而本仓库的工作流就是消费刚发布的 SDK 版本，自己的 scope 必须放行。
- **为什么 `allowBuilds` 里 protobufjs 是 false？** 它的 postinstall 只打印一条版本
  兼容性警告，无实际构建；pnpm 10 时代它也从未运行过。pnpm 12 要求显式声明。
- **提升后 lockfile 真的不用动？** 不用。lockfile 记录的是 integrity 哈希，insider 与
  公开 npm 的 tarball 哈希一致。
