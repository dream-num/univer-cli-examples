## 1. Example 基线与依赖

- [x] 1.1 从 `examples/04-worktree` 建立独立的 `examples/06-resource-backed-slide`，更新 package 身份、exact beta.2 Resource Library/SVG compiler 依赖、`@univerjs-pro/cli-assets@0.1.0`、lockfile 和运行产物 ignore 规则，不改动继承的命令行为。验证：在 example 目录执行 `pnpm install --frozen-lockfile` 和 `pnpm build`，并确认新增 package 版本与设计一致。

## 2. Resource Library 与 SVG compiler 装配

- [x] 2.1 在 composition root 注册标准 `resources` 和 `compile-svg` commands：默认读取官方 CLI asset manifest、使用绝对 `.data/resources` cache root、Node adapters 与 `builtinTextMeasurer`；仅为测试给 `createProgram()` 增加可选 `openResourceLibrary` factory。验证：命令 help 同时列出新旧 commands，且 in-process test 通过 fixed manifest/fake downloader 完成 canonical resource 的 find 和 export。

## 3. Baseline Slide Authoring Source

- [x] 3.1 新增 960 × 540 的 `authoring/page.svg`，实现“产品发布状态”深色单页视觉合同，并引用 `authoring/resources/example-tabler-outline--rocket.svg`；仓库只提交 Authoring Source。验证：使用 fake-exported asset 编译 page 1，断言 viewport、deterministic measurement、零 warnings 和仅预期 estimation lint；删除 asset 后编译必须报出缺失的相对路径。

## 4. 端到端 Review Evidence

- [x] 4.1 扩展 smoke test，用 fixed manifest/fake downloader 离线执行 resource export → `compile-svg --out` → `execute --file` → inspect → layout lint → PNG screenshot，并覆盖非 confirmed commit 的停止条件。验证：测试断言 confirmed revision、Baseline Slide 结构、零 layout findings 和可读 PNG；人工检查 screenshot 的对齐、层级、对比度与内容完整性。

## 5. 专用 Agent skill

- [x] 5.1 以 `skills/univer-slide-authoring/SKILL.md` 替换继承的通用 content skill，收紧为单页 SVG authoring、stable resource handle、标准两步执行、Review Evidence 和 replace-only 修正流程，并更新 install/uninstall symlink。验证：skill validator 通过，`pnpm skill:install` 后可从安装路径读取该 skill，`pnpm skill:uninstall` 清理 symlink，且内容未引入多页、chart、table、template 或手写 Facade drawing workflow。

## 6. 教学文档与全量检查

- [x] 6.1 更新 example 中英文 README 和根索引，记录固定 handle、资源导出、两步编译/提交、diagnostics、视觉修正与 Ready handoff，保持一页教学范围。验证：在 `examples/06-resource-backed-slide` 执行 `pnpm check`，按 README 完成一次真实 manifest 的 find/export 手动验证，并确认 exported resource、generated program、database/cache 和 screenshot 都未被 Git 跟踪。
