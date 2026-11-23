# 01 Content Operations · Edit a collaborative document from the CLI

English | [简体中文](./README.zh-CN.md)

In this first Univer CLI SDK example, you'll create a spreadsheet in the terminal, read and edit its cells, then open the same spreadsheet in a browser to see the change. The CLI and the web editor connect to one local collaboration server and use the same Unit ID to open the file. The CLI also supports documents (Doc) and presentations (Slide).

## Start the example

Use Node.js 22.12 or later and pnpm 12.16.1. From `examples/01-content-operations`, run:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

`link-cli` registers the example's `univer-example-cli` command. The server prints `http://127.0.0.1:3010` when it starts. Leave it running and open a second terminal in the same directory.

## Write to a blank spreadsheet

Create a blank Sheet named Demo, capture its Unit ID, and read the first two rows of its first worksheet:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Demo")
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$UNIT_ID" --json
```

The four cells in `A1:B2` are empty. Use `execute` to write the column headers and the first inventory item in a single edit:

```bash
univer-example-cli execute --unit "$UNIT_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Item", "Quantity"], ["Apples", 2]])'
```

The CLI uses the Collaboration Runtime to load the workbook, apply the edit, and commit it. Once the output shows `"commit": "confirmed"`, open the spreadsheet in your browser:

```bash
univer-example-cli open --unit "$UNIT_ID"
```

On the `Data` worksheet, A2 should now show `Apples` and B2 should show `2`. You can switch Units in the file sidebar. The server stores the data in `.data/content-operations-demo.sqlite`, so the same ID works after a restart.

When writing your own edits, use the CLI to look up a Facade method and see how to call it:

```bash
univer-example-cli api find setValues --unit sheet
univer-example-cli api show FRange.setValues
```

## Use the same CLI with an agent

With the server running, run `pnpm skill:install` in the example directory. Open that directory with your agent and enter:

```text
Use univer-content to create a sales spreadsheet with 10 sample records.
```

The bundled `univer-content` skill guides the agent through creating the Sheet, writing the data, and reading it back with `inspect`. Open the link the agent returns to review the ten records in the web editor.

## Finish

Press Ctrl+C in the server terminal. If you installed the skill, run `pnpm skill:uninstall`. Run `pnpm unlink-cli` to remove the example's CLI command.

This example uses Univer CLI SDK and Univer SDK 1.6.1. After changing the example, run `pnpm check` from this directory.
