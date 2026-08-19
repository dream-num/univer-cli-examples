# univer-mini-cli

English | [简体中文](./README.zh-CN.md)

A minimal local Office CLI example for Agents. It composes core Univer CLI SDK capabilities into a
complete workflow:

```text
create / import -> inspect -> api find / show -> execute -> export
```

It creates, imports, inspects, and edits Sheet, Doc, and Slide Units, and exports them as
XLSX/CSV/TSV, DOCX, and PPTX. Successful commands write JSON to stdout; failures use a non-zero exit
code and write a JSON error to stderr.

## Scope

This is an intentionally small teaching example, not a complete product CLI. It keeps only the
minimum loop an Agent needs for real Office content work, stores content in local `*.unit.json`
files, and creates a separate Univer instance for each command that needs a content runtime.

That design makes the package composition easy to read and copy. It does not address high-frequency
runtime performance, concurrent editing, revision history, remote collaboration, or visual review.

## Requirements

- Node.js `>=22.12.0`
- pnpm
- A Univer / Univer Pro license compatible with the pinned packages

Provide the license through an environment variable:

```bash
export UNIVER_LICENSE="..."
```

Build and run the example from the repository root:

```bash
pnpm --filter @univer-cli-example/univer-mini-cli build
pnpm --filter @univer-cli-example/univer-mini-cli start:built --help
```

After linking the package bin, the commands below can also be invoked directly as `univer-mini`.

## Complete workflow

Create a local Sheet Unit:

```bash
univer-mini create sheet ./report.unit.json --name "Quarterly report"
```

You can also begin with an Office file. The input type is inferred from its extension:

```bash
univer-mini import ./source.xlsx ./report.unit.json
univer-mini import ./proposal.docx ./proposal.unit.json
univer-mini import ./deck.pptx ./deck.unit.json
```

Inspect the structured content before editing:

```bash
univer-mini inspect ./report.unit.json workbook
univer-mini inspect ./report.unit.json worksheet name:Plan
univer-mini inspect ./report.unit.json range A1:F20 --worksheet name:Plan
univer-mini inspect ./proposal.unit.json document
univer-mini inspect ./deck.unit.json presentation
```

Search the current Univer SDK reference offline when the Facade API is unclear:

```bash
univer-mini api find "conditional formatting" --unit sheet
univer-mini api show FRange.setValues
```

Execute Facade JavaScript. The runtime supplies stable bindings for each Unit type: `workbook` for
Sheet, `doc` for Doc, and `presentation` for Slide. All three also receive `univerAPI` and `api`.

```bash
univer-mini execute ./report.unit.json \
  --code 'workbook.getActiveSheet().getRange("A1:B2").setValues([[1, 2], [3, 4]])'
```

Put longer programs in a file to avoid shell quoting:

```bash
univer-mini execute ./deck.unit.json --file ./scripts/build-deck.js
```

The local Unit file is replaced atomically only after execution succeeds. Export the final artifact:

```bash
univer-mini export ./report.unit.json ./report.xlsx
univer-mini export ./proposal.unit.json ./proposal.docx
univer-mini export ./deck.unit.json ./deck.pptx
```

## Local Unit files

`*.unit.json` is an application-owned persistence format, not a Univer CLI SDK public contract. It
uses a versioned envelope around the Unit type and complete UnitData:

```json
{
  "format": "univer-mini/local-office-unit",
  "version": 1,
  "unitType": "sheet",
  "data": {}
}
```

Each content command creates a short-lived headless runtime, loads the data through Univer's public
`createUnit()` API, and closes the runtime in `finally`. This example does not need a daemon, worker
pool, collaboration runtime, collaboration server, or remote Workspace.

## Security and boundaries

`execute` uses JavaScript `Function`; it is not a security sandbox and must run only trusted code.
The application owns local paths, its file format, JSON presentation, and runtime lifecycle.
Content execution, inspection, API reference, and Office conversion rules remain in their matching
capability packages.

## Next steps

1. **Performance and lifecycle:** combine `@univer-cli/daemon` with the keyed instance pool to reuse
   a headless Univer runtime across short-lived CLI processes, then add idle eviction, instance
   invalidation, and daemon shutdown.
2. **Versioning and collaboration:** combine the Univer Collaboration SDK with
   `@univer-cli/univer-collaboration-runtime` to replace local UnitData files with Snapshot,
   changeset, revision, OT, and Worktree workflows. Add
   `@univer-cli/univer-collaboration-runtime-pool` when worker isolation and reuse are needed.
3. **Visual review and advanced capabilities:** add `@univer-cli/unit-screenshot`,
   `@univer-cli/unit-layout-lint`, and the render runtime for an edit-render-inspect-fix loop, then
   add SVG/Typst compilation or the resource library as required.
