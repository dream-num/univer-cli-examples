# 01 Content Operations

English | [简体中文](./README.zh-CN.md)

The first example shows the complete content-operation loop with the smallest assembly: start the
Server, create a Sheet, Doc, or Slide, read, edit, and commit it through the CLI, then open the same
collaborative Unit in the Web editor.

The Web page has a small file sidebar for listing, creating, and switching between the persisted
Units.

```text
CLI ──┐
      ├── Collaboration Server ── SQLite Adapter
Web ──┘
```

## Run

After entering this example, run every command from the current directory:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal in the same directory. `create` prints the new short Unit ID, so the remaining
commands can capture and reuse it directly:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Demo")

univer-example-cli inspect range A1:B2 --worksheet index:1 \
  --unit "$UNIT_ID" --json

univer-example-cli execute --unit "$UNIT_ID" \
  --code 'workbook.getActiveSheet().getRange("A2:B2").setValues([["Updated", 2]])'

univer-example-cli open --unit "$UNIT_ID"

# Simulate an Agent querying the Facade API before generating execution code
univer-example-cli api find setValues --unit sheet
univer-example-cli api show FRange.setValues
```

## Use it with an Agent

Keep the Server running and install the skill from the other terminal:

```bash
pnpm skill:install
```

Open the current directory with an Agent and enter:

```text
Use univer-content to create a sales spreadsheet with 10 sample records.
```

The Agent creates, populates, commits, and verifies the Unit, then returns a Web URL. The skill
source is `skills/univer-content/SKILL.md`; it is not part of the application build. When
finished, run:

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## Source order

Read `src/server/main.ts`, `src/server/server.ts`, and `src/server/unit-store.ts`, then the features:
`unit.ts` contains `create/open`, `unit-content.ts` contains `inspect/execute` and their collaboration
runtime, and `api.ts` contains the Facade API commands. Finish with `src/cli/program.ts` and
`src/web/`. `inspect` and `api` use CLI SDK Commander presets; the other commands are thin
application adapters.

Run `pnpm check` to verify this example.

This example supports Sheet, Doc, and Slide with SQLite persistence and one demo user. Data is
stored in `.data/content-operations.sqlite`. It does not cover login, authorization, conflict
retries, backups, migrations, or Worktree.
