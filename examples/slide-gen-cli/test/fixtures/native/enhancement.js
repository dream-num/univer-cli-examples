const slide = presentation.getSlideByIndex(0);
const chartInfo = slide
  .newChart(univerAPI.Enum.ChartTypeString.Column)
  .setSource([
    ["Stage", "Completion"],
    ["Validate", 100],
    ["Review", 72],
    ["Launch", 44],
  ])
  .setCategoryField(0)
  .setValueFields([1])
  .setAbsolutePosition(74, 160)
  .setSize(480, 250)
  .build();
const chart = await slide.insertChart(chartInfo);
if (chart === null) throw new Error("Failed to insert native chart");

const table = slide.insertTable(
  slide
    .newTable()
    .setValues([
      ["Gate", "Owner"],
      ["QA", "Lin"],
      ["Ready", "Mina"],
    ])
    .setAbsolutePosition(590, 160)
    .setSize(266, 250)
    .build(),
);
if (table === null) throw new Error("Failed to insert native table");

return { charts: slide.getCharts().length, tables: slide.getTables().length };
