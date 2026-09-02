## 1. Deck-level Authoring Source 与 Baseline Deck

- [x] 1.1 在 Change 1 已应用的 `examples/slide-gen-cli/` 中，将迁移期 `authoring/page.svg` 整理为包含 Presentation Brief/deck spec、`authoring/pages/page-NN-*.svg`、`authoring/resources/` 和 optional `authoring/enhancements/` 的 Authoring Source；提交至少两个连续 960 × 540 baseline pages，并让其中至少一页引用 canonical stable-handle rocket resource。验证：检查 committed source 与 ignore rules，逐页运行 `slide-gen-cli compile-svg ... --page N --json`，确认无需每页引用资源且 `.generated/` 仍是 disposable output。

## 2. Per-page generation contract

- [x] 2.1 扩展 program/smoke coverage，以现有 `compile-svg` 和 `execute --file` 证明首次生成从 page 1 连续递增、已有 page replace、`pageCount + 1` append、`page > pageCount + 1` rejection，并证明其他 pages 不受局部 replacement 影响；不新增 deck compiler、orchestrator 或 custom apply adapter。验证：运行聚焦的 Vitest tests，断言每次成功 execution 都为 confirmed commit、跳页不会创建空白 page，且测试没有固定最大页数。

## 3. 可重放 Native Enhancement fixture

- [x] 3.1 增加独立于 Baseline Deck 的最小 native fixture：page SVG 负责普通 shape/text/image 与 native element 占位，保存的 enhancement 在最后一次 page replacement 后插入 editable chart/table，并为 chart 显式设置 category field 与 value fields mapping。验证：fixture tests 先执行 replacement、再执行 enhancement，随后再次 replacement 证明 native elements 被移除，重放 enhancement 后 inspection 恢复预期 chart/table 且所有 commits confirmed。

## 4. Native-capable Web Viewer

- [x] 4.1 在 Slide-only Web composition 中加入与现有公开 `1.0.0-beta.2` cohort 对齐的 `@univerjs-pro/slides-chart`、`@univerjs-pro/slides-chart-ui`、`@univerjs-pro/slides-table`、`@univerjs-pro/slides-table-ui` direct dependencies，并注册 plugins、styles 与 `en-US` locales；保留 Slides 所需 Docs/Drawing closure、trunk/Worktree routing 和 review actions。验证：执行 frozen install、Web typecheck/build，并在运行中的 Server 打开 native fixture 的 trunk 与 Worktree URL，确认 chart/table 可见、可编辑且 Ready/Reopen/Merge/Discard 状态正确。

## 5. Deck Review Evidence 与交付链

- [x] 5.1 将 smoke workflow 扩展为逐页保存 compiler diagnostics、structured inspection、零 layout findings 和 PNG screenshots，再完成叙事、字体、颜色、资源风格、page size 与 native placement 的 deck-level consistency assessment；通过后标记 Worktree Ready、返回同一 Unit/Worktree 的 Server-scoped Review URL，并从该 Worktree revision 验证按需 PPTX export。验证：smoke test 断言至少两页、逐页 evidence、confirmed revision、Ready URL target，以及 exported PPTX 的 page count 来自 Worktree 而非 trunk。

## 6. Native inspection、render 与 PPTX acceptance

- [x] 6.1 对独立 native fixture 覆盖 inspect、render page、layout lint、PNG screenshot、Web Viewer 和 Worktree PPTX export；捕获 exporter diagnostics，并读取 OOXML package 断言 chart XML、embedded workbook 与含 native table 的 slide XML。验证：聚焦 test 与真实 Viewer check 均通过，且 test 在缺少 category/value mapping 或预期 OOXML entry 时失败，不以 ZIP signature 作为成功条件。

## 7. Agent skill 与用户故事

- [x] 7.1 更新 `univer-slide-authoring`、`README.md` 与 `README.zh-CN.md`，以 Presentation Brief → deck spec → 连续逐页 generation/revision → optional Native Enhancement replay → per-page evidence/deck review → Ready Review URL/按需 PPTX 为主故事；删除单页、chart/table 和 PPTX 禁令，继续排除 import、template system 与普通元素的手写 Facade authoring。验证：skill validator 与 install/uninstall checks 通过，并检查文案没有人工 page cap、public/permanent URL 承诺或旧 application identity。

## 8. Scope regression 与全量检查

- [x] 8.1 更新现有 regression assertions，使 fixed manifest/fake downloader 下的 Baseline Deck 和独立 native fixture 均不访问远程 asset host，并确认未恢复 Sheet、Doc、Office import，未引入新的 adapter/orchestrator/persistence，且未修改 `01`–`04` behavior。验证：在 `examples/slide-gen-cli` 执行覆盖 format、lint、typecheck、build 和 tests 的 `pnpm check`，再用 repository-wide search 检查禁止的 surface 和旧单页限制。
