import { Command } from "commander";
import { buildTypstDocument, type MachineFailure, type MachineResult } from "./typst.js";

interface CompileTypstOptions {
  readonly json?: boolean;
  readonly out?: string;
}

export function createProgram(): Command {
  const program = new Command("doc-gen").description(
    "Author a local Univer Doc from a Typst Source Bundle",
  );
  program.addCommand(createCompileTypstCommand());
  return program;
}

function createCompileTypstCommand(): Command {
  const command = new Command("compile-typst")
    .description("Compile, materialize, and render a Typst Source Bundle")
    .argument("<bundle>", "bundle directory or typst.json path")
    .option("--out <directory>", "directory for Generated Artifacts")
    .option("--json", "write one machine-readable result")
    .action(async (bundle: string, options: CompileTypstOptions) => {
      const result =
        options.out === undefined
          ? argumentFailure("compile-typst requires --out <directory>")
          : await buildTypstDocument(bundle, options.out);
      writeResult(result, options.json === true);
      if (!result.ok) process.exitCode = 1;
    });
  return command;
}

function argumentFailure(message: string): MachineFailure {
  return { ok: false, code: "ARGUMENT_ERROR", message, diagnostics: [], artifacts: {} };
}

function writeResult(result: MachineResult | MachineFailure, json: boolean): void {
  if (json) {
    const stream = result.ok ? process.stdout : process.stderr;
    stream.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (result.ok) {
    process.stdout.write(
      `Created Doc ${result.targetUnitId} (${String(result.diagnostics.length)} diagnostics)\n` +
        `Document: ${result.artifacts.document}\n` +
        `Typst previews: ${result.artifacts.typstPreviews.join(", ")}\n` +
        `Univer screenshots: ${result.artifacts.univerScreenshots.join(", ")}\n`,
    );
  } else {
    process.stderr.write(`${result.code}: ${result.message}\n`);
  }
}
