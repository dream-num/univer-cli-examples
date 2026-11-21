# 02 File Exchange · Import and export Office files

English | [简体中文](./README.zh-CN.md)

This example adds `export` and `import` to the content commands from example 01. You'll export a sales spreadsheet to a local Excel file, import it as a new collaborative Sheet, and check its contents in the CLI and browser. The CLI converts Office files locally, and the collaboration server stores the imported content.

## Start the example

Use Node.js 22.12 or later and pnpm 12.16.1. From `examples/02-file-exchange`, run:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

The server prints `http://127.0.0.1:3010` when it starts. Leave it running and open a second terminal in the same directory.

## Export a spreadsheet to Excel

Create a blank Sheet, enter the sales figure for January, and export the committed data to `sales.xlsx` in the current directory:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Sales")
univer-example-cli execute --unit "$UNIT_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Month", "Sales"], ["January", 120]])'
univer-example-cli export sales.xlsx --unit "$UNIT_ID"
```

## Import the file and check its contents

```bash
IMPORTED_ID=$(univer-example-cli import sales.xlsx --name "Imported sales")
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$IMPORTED_ID" --json
univer-example-cli open --unit "$IMPORTED_ID"
```

The import returns a new Unit ID. In the inspection output, the second row of `displayValues` should be `["January", "120"]`. The browser sidebar lists both the original `Sales` and the imported `Imported sales`. You can edit each Sheet independently.

The same commands support Doc (`.docx`) and Slide (`.pptx`). The input file extension determines the Unit type on import. On export, use the extension that matches the Unit's type.

## Work with an agent

Run `pnpm skill:install` in the example directory, then open that directory with your agent. Try this with the Excel file you just exported:

```text
Use univer-content to import ./sales.xlsx, change January sales to 1000, read the value back, and export the result to ./updated-sales.xlsx.
```

When finished, press Ctrl+C in the server terminal. If you installed the skill, run `pnpm skill:uninstall`. Run `pnpm unlink-cli` to remove this example's CLI command.

This example uses Univer CLI SDK and Univer SDK 1.6.0. The server stores collaborative data in `.data/file-exchange-demo.sqlite`. After changing the example, run `pnpm check`.
