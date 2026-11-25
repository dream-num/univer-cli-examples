# 03 Visual Inspection · Review rendered documents

English | [简体中文](./README.zh-CN.md)

This example adds visual inspection to the file exchange workflow from example 02. You'll write two rows to a blank spreadsheet, read the cell values back, and capture the same range to see how the text and numbers appear on the worksheet. The `screenshot` command reads the committed content from the collaboration server, renders it in a local browser, and saves a PNG.

## Start the example

Use Node.js 22.12 or later, pnpm 12.16.1, and a local installation of Chrome, Chromium, or Edge. From `examples/03-visual-inspection`, run:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

The server prints `http://127.0.0.1:3010` when it starts. Leave it running and open a second terminal in the same directory.

## Capture a spreadsheet range

Create a sales spreadsheet and write the headers and January sales figure to its `Data` worksheet:

```bash
SHEET_ID=$(univer-example-cli create sheet --name "Sales")
univer-example-cli execute --unit "$SHEET_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Month", "Sales"], ["January", 120]])'
```

Once the output shows `"commit": "confirmed"`, inspect the range you wrote and capture it as an image:

```bash
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$SHEET_ID" --json
univer-example-cli screenshot --unit "$SHEET_ID" --sheet Data --range A1:B2 --out output/sheet
```

The second row of `displayValues` should be `["January", "120"]`. Open the PNG at the path printed by `screenshot` and check that both rows are visible and the text fits. To make adjustments in the web editor, run `univer-example-cli open --unit "$SHEET_ID"`.

## Review Docs and Slides

If you have a Word document or PowerPoint presentation, you can import it and review its pages. Replace the filenames below with paths to your local files:

```bash
DOC_ID=$(univer-example-cli import report.docx)
univer-example-cli screenshot --unit "$DOC_ID" --out output/doc

SLIDE_ID=$(univer-example-cli import slides.pptx)
univer-example-cli screenshot --unit "$SLIDE_ID" --pages 1 --out output/slide
univer-example-cli lint --unit "$SLIDE_ID" --pages 1
```

Doc screenshots are captured by page. For a Slide, `--pages` selects the pages to review. The example captures page 1 and runs `lint` on that page to find text overflow and overlapping elements. Use the image to decide which findings need attention.

## Review screenshots with an agent

Run `pnpm skill:install` in the example directory, then open it with an agent that supports image input and enter:

```text
Use univer-content to create a sales spreadsheet with 10 records. Read the data back, capture the headers and all 10 records, and open the PNG to check for clipped text.
```

When finished, press Ctrl+C in the server terminal. If you installed the skill, run `pnpm skill:uninstall`. Run `pnpm unlink-cli` to remove this example's CLI command.

This example uses Univer CLI SDK and Univer SDK 1.6.2. Collaborative data is stored in `.data/visual-inspection-demo.sqlite`. After changing the example, run `pnpm check`.
