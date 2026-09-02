## 1. Application identity 迁移

- [ ] 1.1 将 `examples/06-resource-backed-slide/` move 为 `examples/slide-gen-cli/`，统一 package name、`slide-gen-cli` binary、CLI/Web title、skill scripts 与根索引位置，并把它从编号教程表移到独立 Agent application 区域。验证：检查 package metadata 和中英文根索引，并在 active application files 中搜索确认没有遗留的 `06-resource-backed-slide`、`@univer-cli-example/resource-backed-slide` 或 `univer-example-cli` 用户入口。

## 2. Slide-only shared 与 Server contract

- [ ] 2.1 把 shared Unit metadata 收敛为 `unitType: "slide"` literal，并让 `/api/units` 只根据 `unitId`/`name` 创建空 Slide snapshot；删除 Sheet/Doc constructors、imported data dispatch 和跨 Unit conversion branches，保留 UnitStore、WorktreeStore 与 collaboration transports。验证：Server tests 证明默认和命名 create 都返回 Slide，legacy Sheet/Doc type 或 imported data 不能创建、导入或加载非 Slide Unit，现有 trunk/Worktree endpoints 仍工作。

## 3. Slide-only CLI 与 PPTX export

- [ ] 3.1 将 `create` 改为无 Unit type 参数的 Slide create，移除 top-level `import`，把 runtime、execute、render 和 file feature 收敛为 Slide，并将 `export` 固定为保留 `--trunk`/`--worktree` target 的 `.pptx` only path；保留 API reference、resources、compile-svg、Worktree、inspect、lint、screenshot、open commands。验证：command tests 检查 help surface、无 type create、缺失的 import、非 `.pptx` rejection，以及 trunk/Worktree 各自导出的有效 PPTX。

## 4. Slide-only Web review

- [ ] 4.1 删除 Web create type selector、Sheet/Doc presets/locales/load branches，让 New 与 Viewer 固定创建和加载 Slide；保留 Slides 所需 Docs/Drawing plugins、trunk/Worktree routing、连接状态和 Ready/Reopen/Merge/Discard actions，不注册 chart/table plugins。验证：Web build/typecheck 通过，并在运行中的 Server 中分别打开 trunk 与 Ready Review URL，确认只显示 Slide、目标 Worktree revision 和正确 review actions。

## 5. Dependency closure 与 lockfile

- [ ] 5.1 删除 `@univerjs/preset-sheets-core`、`@univerjs/preset-docs-core` 及其他经 import graph 证明只服务被删分支的 direct dependencies，保留 Slides 内部 Docs/Drawing、render/screenshot、collaboration 和 PPTX exchange closure，并更新 renamed importer 的 lockfile。验证：在 `examples/slide-gen-cli` 执行 `pnpm install --frozen-lockfile`、`pnpm build` 和 `pnpm typecheck`，并检查 package/lockfile 中两个 preset 不再是该 application 的 direct dependencies。

## 6. Slide-only 与单页 baseline regression

- [ ] 6.1 用 Slide-only coverage 替换继承的 Sheet/Doc/import smoke path，同时保留 fixed manifest/fake downloader 的 resource export → `compile-svg --page 1` → Worktree execute → inspection → layout lint → PNG screenshot → Ready → Review URL workflow；增加 Worktree lifecycle 与 trunk/Worktree PPTX assertions。验证：`pnpm test` 在不访问远程 asset host 的情况下通过，并覆盖 confirmed commit、零 layout findings、可读 PNG、Review URL target 和两个 PPTX source revisions。

## 7. Agent skill、文档与全量检查

- [ ] 7.1 更新 `univer-slide-authoring`、中英文 README 和 root index 中的 application path/binary/Slide-only commands，保留当前单页 Authoring Source 与 Review Evidence 指导，明确 Review URL 仅在内置 Server 运行期间有效，且不加入多页、Native Enhancement、chart/table 或第二个 Change 的 deck workflow。验证：skill validator 与 install/uninstall checks 通过，随后在 `examples/slide-gen-cli` 执行 `pnpm check`，并确认中英文文档的手工 happy path 可创建 Slide、完成 Worktree review、打开 Review URL 和导出 PPTX。
