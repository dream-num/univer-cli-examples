import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";
import {
  executeDocument,
  failure,
  loadDocument,
  type ExecuteResult,
  type OperationFailure,
} from "./document.js";
import {
  buildTypstDocument,
  renderDocument,
  type MachineFailure,
  type MachineResult,
} from "./typst.js";

interface CompileTypstOptions {
  readonly json?: boolean;
  readonly out?: string;
}

interface ExecuteOptions {
  readonly file?: string;
  readonly json?: boolean;
}

interface ScreenshotOptions {
  readonly json?: boolean;
  readonly out?: string;
}

interface ScreenshotResult {
  readonly ok: true;
  readonly targetUnitId: string;
  readonly screenshots: readonly string[];
}

type CliResult =
  | MachineResult
  | MachineFailure
  | ExecuteResult
  | ScreenshotResult
  | OperationFailure;

export function createProgram(): Command {
  const program = new Command("doc-gen").description(
    "Author a local Univer Doc from a Typst Source Bundle",
  );
  program.addCommand(createApiCommand({ reference: createStandardApiReference() }));
  program.addCommand(createCompileTypstCommand());
  program.addCommand(createExecuteCommand());
  program.addCommand(createScreenshotCommand());
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

function createExecuteCommand(): Command {
  return new Command("execute")
    .description("Execute trusted Facade JavaScript against a local Materialized Doc")
    .argument("<document>", "document.json path")
    .option("--file <path>", "trusted task-local Facade JavaScript")
    .option("--json", "write one machine-readable result")
    .action(async (document: string, options: ExecuteOptions) => {
      const result =
        options.file === undefined
          ? operationArgumentFailure("execute requires --file <path>")
          : await executeDocument(document, options.file);
      writeResult(result, options.json === true);
      if (!result.ok) process.exitCode = 1;
    });
}

function createScreenshotCommand(): Command {
  return new Command("screenshot")
    .description("Render a local Materialized Doc as PNG images")
    .argument("<document>", "document.json path")
    .option("--out <directory>", "directory for Univer Screenshots")
    .option("--json", "write one machine-readable result")
    .action(async (document: string, options: ScreenshotOptions) => {
      const result =
        options.out === undefined
          ? operationArgumentFailure("screenshot requires --out <directory>")
          : await screenshotDocument(document, options.out);
      writeResult(result, options.json === true);
      if (!result.ok) process.exitCode = 1;
    });
}

async function screenshotDocument(
  document: string,
  destination: string,
): Promise<ScreenshotResult | OperationFailure> {
  try {
    const loaded = await loadDocument(document);
    const screenshots = await renderDocument(loaded.data, destination, true);
    return { ok: true, targetUnitId: loaded.data.id, screenshots };
  } catch (error) {
    return failure(error, "RENDER_ERROR");
  }
}

function argumentFailure(message: string): MachineFailure {
  return { ok: false, code: "ARGUMENT_ERROR", message, diagnostics: [], artifacts: {} };
}

function operationArgumentFailure(message: string): OperationFailure {
  return { ok: false, code: "ARGUMENT_ERROR", message };
}

function writeResult(result: CliResult, json: boolean): void {
  if (json) {
    const stream = result.ok ? process.stdout : process.stderr;
    stream.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (result.ok) {
    if ("artifacts" in result) {
      process.stdout.write(
        `Created Doc ${result.targetUnitId} (${String(result.diagnostics.length)} diagnostics)\n` +
          `Document: ${result.artifacts.document}\n` +
          `Typst previews: ${result.artifacts.typstPreviews.join(", ")}\n` +
          `Univer screenshots: ${result.artifacts.univerScreenshots.join(", ")}\n`,
      );
    } else if ("screenshots" in result) {
      process.stdout.write(`${result.screenshots.join("\n")}\n`);
    } else {
      process.stdout.write(`Updated Doc ${result.targetUnitId}: ${result.document}\n`);
    }
  } else {
    process.stderr.write(`${result.code}: ${result.message}\n`);
  }
}
