#text(size: 8pt, weight: "bold", fill: green)[RELEASE NOTE  /  2026.09]

#text(size: 24pt, weight: "bold", fill: navy)[Univer CLI SDK 发布简报]

#text(size: 10.5pt, fill: muted)[用可维护的 Typst 源稿，构建漂亮、可编辑、可验证的 Univer Doc。]

#v(5pt)
#line(length: 100%, stroke: (paint: accent, thickness: 2pt))
#v(8pt)

#summary[
  #text(weight: "bold", fill: navy)[本期摘要]  `compile-typst` 在一次本地调用中完成编译、Doc 物化与双重视觉验证。源稿保持简洁，生成结果可以交给 Univer 继续编辑。
]

#section-title[目标]

让开发者和 agent 共享同一条清晰路径：直接编辑 Typst Source Bundle，通过结构化 diagnostics 修正问题，再对照源侧预览与最终 Univer 截图确认结果。

#section-title[核心能力]

#table(
  columns: (1.2fr, 2.4fr, 1.3fr),
  inset: 6pt,
  stroke: 0.45pt + rule,
  table.header(
    table.cell(fill: navy)[#text(weight: "bold", fill: white)[阶段]],
    table.cell(fill: navy)[#text(weight: "bold", fill: white)[交付结果]],
    table.cell(fill: navy)[#text(weight: "bold", fill: white)[检查重点]],
  ),
  table.cell(fill: pale)[#text(weight: "bold")[Compile]],
  [Facade program、diagnostics 与 Typst Preview],
  [语义与源侧排版],
  table.cell(fill: pale)[#text(weight: "bold")[Materialize]],
  [可保存、可继续编辑的 Materialized Doc],
  [Local Doc Identity],
  table.cell(fill: pale)[#text(weight: "bold")[Render]],
  [逐页 Univer Screenshot 与 Machine Result],
  [换行、表格与缺失内容],
)

#section-title[下一步]

#text(weight: "bold", fill: green)[01] 创建独立 bundle 源稿  ·  #text(weight: "bold", fill: green)[02] 运行一次完整命令  ·  #text(weight: "bold", fill: green)[03] 阅读两类 PNG 后交付

#v(6pt)
#text(size: 8.5pt, fill: muted)[同一份源稿，同一条命令，两层证据。]
