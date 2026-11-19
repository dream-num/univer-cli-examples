# 04 Worktree · Review draft edits before merging

English | [简体中文](./README.zh-CN.md)

Example 03 lets you inspect committed content. Here you can edit a Worktree, compare its contents with trunk, and hand the draft to someone else to review in the web editor. The walkthrough starts with an empty spreadsheet so you can see exactly when the changes reach trunk.

## Start the example

Use Node.js 22.12 or later and pnpm 12.16.1. From `examples/04-worktree`, run:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Leave the server running. In a second terminal in the same directory, create a blank sales spreadsheet and a Worktree for it:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Sales")
WORKTREE_ID=$(univer-example-cli worktree create --unit "$UNIT_ID")
```

## Edit the draft and compare it with trunk

Write two rows to the draft, then read the same range from both targets:

```bash
univer-example-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([["Month", "Sales"], ["January", 120]])'

univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
univer-example-cli inspect range A1:B2 --worksheet index:1 --unit "$UNIT_ID" --trunk --json
```

The draft shows January sales of 120. The same cells on trunk are still empty. In this example, CLI edits require a Worktree. Reads, screenshots, and exports can target either version. To export the draft for review:

```bash
univer-example-cli export review.xlsx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

## Review and merge

Mark the draft Ready and open it in the web editor:

```bash
univer-example-cli worktree ready "$WORKTREE_ID"
univer-example-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

A Ready draft is read-only. Choose **Merge** to apply the edits to trunk, **Reopen** to continue editing the draft, or **Discard** to abandon it. After merging, open trunk to see the two rows:

```bash
univer-example-cli open --unit "$UNIT_ID" --trunk
```

The web editor also allows direct trunk edits. Applications can enforce their own write policy through server middleware and access controls.

## Try it with an agent

Run `pnpm skill:install`, open the example directory with an agent, and ask:

```text
Create a sales spreadsheet with 10 records in a Worktree. Check the values and give me the Ready draft to review.
```

When finished, press Ctrl+C in the server terminal. If you installed the skill, run `pnpm skill:uninstall`. Run `pnpm unlink-cli` to remove this example's CLI command.

This example uses Univer CLI SDK and Univer SDK 1.5.2. Trunk and Worktree data are stored in `.data/worktree.sqlite`.
