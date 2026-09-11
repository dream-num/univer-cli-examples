# 04 Worktree

English | [简体中文](./README.zh-CN.md)

This example keeps file exchange and visual inspection from 03, then adds Worktree.
An Agent edits an isolated draft, marks it Ready, and hands it to a human for Merge, Reopen, or
Discard in the Web UI.

```text
Trunk (editable in Web) → Worktree draft (editable) → Ready → Web review → Merge / Reopen / Discard
```

## Run

After entering this example, run every command from the current directory:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal to create a trunk Unit and its Worktree:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Worktree Demo")
WORKTREE_ID=$(univer-example-cli worktree create --unit "$UNIT_ID")
```

CLI reads can target trunk or Worktree. CLI content execution edits a Worktree:

```bash
univer-example-cli inspect workbook --unit "$UNIT_ID" --trunk
univer-example-cli inspect workbook --unit "$UNIT_ID" --worktree "$WORKTREE_ID"

univer-example-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --code 'workbook.getActiveSheet().getRange("A2:B2").setValues([["Draft", 2]])'

univer-example-cli inspect range A1:B2 --worksheet index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
```

After the Agent checks the draft, mark it Ready and open the Web UI:

```bash
univer-example-cli worktree ready "$WORKTREE_ID"
univer-example-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

The Web UI allows direct trunk editing. A Worktree remains editable only in draft; Ready offers
Discard, Reopen, and Merge. After Merge, open the trunk:

```bash
univer-example-cli open --unit "$UNIT_ID" --trunk
```

Export is also a read operation, so it must explicitly target trunk or Worktree:

```bash
univer-example-cli export review.xlsx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

## Example policy

The CLI keeps Agent content execution on a Worktree, while the Web UI intentionally permits direct
trunk editing. This policy belongs to the application; it is not imposed by the Collaboration SDK or
CLI SDK. Production applications should enforce their own trunk write policy with Server middleware
and ACLs.

## Use it with an Agent

Keep the Server running and install the skill from another terminal:

```bash
pnpm skill:install
```

Open this directory with an Agent and enter:

```text
Use univer-content to create a sales spreadsheet with 10 sample records in a Worktree, then hand it to me for review.
```

When finished, run:

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## What changed from 03

Added file:

- `src/cli/features/worktree.ts` creates a Worktree and marks its draft Ready.

Changed files:

- `src/server/server.ts` adds the Worktree Service, Endpoint, and SQLite Adapter.
- `src/cli/features/unit-content.ts` gives reads an explicit target and limits execute to Worktree.
- `src/cli/features/unit.ts`, `file.ts`, and `visual.ts` let open, export, screenshot, and lint read
  trunk or Worktree.
- `src/shared/urls.ts` lets a Web URL target trunk or Worktree.
- `src/web/` keeps trunk and draft editable, and adds Ready, Discard, Reopen, and Merge.
- `package.json` adds the Worktree Client, Service, Endpoint, and SQLite Adapter.
- `skills/univer-content/SKILL.md` moves the Agent edit and verification flow into a Worktree.
- `test/smoke.test.ts` moves the inherited smoke path onto Worktree targets.

Everything else is inherited from 03. This example does not add a runtime pool, worker, or daemon.
Screenshot and layout lint remain available when the user explicitly requests visual verification.
