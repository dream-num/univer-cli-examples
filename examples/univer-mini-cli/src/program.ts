import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  API_REFERENCE_UNITS,
  createStandardApiReference,
  type ApiReferenceUnit,
} from "@univer-cli/api-reference";
import { prepareContentExecutionProgram } from "@univer-cli/content-execution";
import {
  inspectContent,
  type ContentInspectionRuntime,
  type ContentInspectionTarget,
} from "@univer-cli/content-inspection";
import {
  InspectionCommandInputError,
  parseInspectionQuery,
} from "@univer-cli/content-inspection-command";
import { Argument, Command, InvalidArgumentError, Option } from "commander";
import { createEmptyUnit } from "./create-unit.js";
import { MiniCliError } from "./errors.js";
import { exportOfficeFile, importOfficeFile } from "./exchange.js";
import {
  MINI_UNIT_TYPES,
  createLocalUnit,
  isMiniUnitType,
  readLocalUnit,
  replaceLocalUnit,
  writeNewLocalUnit,
  type MiniUnitType,
  type OfficeUnitData,
} from "./local-unit.js";
import { loadLocalRuntime } from "./runtime.js";

const INSPECTION_TARGETS = [
  "workbook",
  "worksheet",
  "range",
  "presentation",
  "slide",
  "document",
  "paragraph",
] as const;

interface ExecuteOptions {
  readonly code?: string;
  readonly file?: string;
}

interface InspectOptions {
  readonly worksheet?: string;
}

interface ApiFindOptions {
  readonly limit: number;
  readonly unit?: ApiReferenceUnit;
}

export function createProgram(): Command {
  const program = new Command("univer-mini")
    .description("Create, inspect, edit, and export local Office Units for agents")
    .showHelpAfterError()
    .exitOverride()
    .configureOutput({ writeErr: () => undefined });

  program.addCommand(createCreateCommand());
  program.addCommand(createImportCommand());
  program.addCommand(createInspectCommand());
  program.addCommand(createApiCommand());
  program.addCommand(createExecuteCommand());
  program.addCommand(createExportCommand());
  return program;
}

function createCreateCommand(): Command {
  return new Command("create")
    .description("Create an empty Sheet, Doc, or Slide local Unit")
    .addArgument(new Argument("<type>", "Office Unit type").choices(MINI_UNIT_TYPES))
    .argument("<unit-file>", "local Unit JSON file to create")
    .option("--name <name>", "Unit display name")
    .action(async (type: string, file: string, options: { readonly name?: string }) => {
      if (!isMiniUnitType(type))
        throw new MiniCliError("UNIT_TYPE_INVALID", `Invalid type ${type}`);
      const path = resolve(file);
      const name = options.name ?? defaultName(path, type);
      const unit = await createEmptyUnit(type, name, license());
      await writeNewLocalUnit(path, unit);
      writeJson({ file: path, unitId: unit.data.id, unitType: unit.unitType });
    });
}

function createImportCommand(): Command {
  return new Command("import")
    .description("Import an Office file into a local Unit")
    .argument("<office-file>", "XLSX, DOCX, PPTX, or another supported Office file")
    .argument("<unit-file>", "local Unit JSON file to create")
    .action(async (source: string, file: string) => {
      const sourcePath = resolve(source);
      const path = resolve(file);
      const unit = await importOfficeFile(sourcePath);
      await writeNewLocalUnit(path, unit);
      writeJson({ file: path, source: sourcePath, unitId: unit.data.id, unitType: unit.unitType });
    });
}

function createInspectCommand(): Command {
  return new Command("inspect")
    .description("Inspect structured content in a local Unit")
    .argument("<unit-file>", "local Unit JSON file")
    .addArgument(new Argument("<target>", "content target").choices(INSPECTION_TARGETS))
    .argument("[selectors...]", "selectors such as id:sheet-1, name:Plan, or index:1")
    .option("--worksheet <selector>", "worksheet selector required by range inspection")
    .action(async (file: string, target: string, selectors: string[], options: InspectOptions) => {
      const path = resolve(file);
      const unit = await readLocalUnit(path);
      const queryTarget = (
        target === "range" ? "worksheet-range" : target
      ) as ContentInspectionTarget;
      let query;
      try {
        query = parseInspectionQuery(queryTarget, selectors, options);
      } catch (error) {
        if (error instanceof InspectionCommandInputError) {
          throw new MiniCliError("INSPECTION_INPUT_INVALID", error.message, { cause: error });
        }
        throw error;
      }
      const runtime = await loadLocalRuntime(unit, license());
      try {
        const inspectionRuntime: ContentInspectionRuntime = {
          execute: async (input) => await runtime.execute(input),
          unitId: runtime.unitId,
          unitType: unit.unitType,
        };
        writeJson(await inspectContent(inspectionRuntime, query));
      } finally {
        await runtime.close();
      }
    });
}

function createApiCommand(): Command {
  const reference = createStandardApiReference();
  const api = new Command("api").description("Discover the Univer Facade API");
  api.addCommand(
    new Command("find")
      .description("Find Facade symbols by task-oriented terms")
      .argument("<terms...>", "one or more search terms")
      .addOption(
        new Option("--unit <unit>", "limit results to a Unit").choices(API_REFERENCE_UNITS),
      )
      .option("--limit <number>", "maximum matches per term", positiveInteger, 20)
      .action((terms: string[], options: ApiFindOptions) => {
        writeJson(
          reference.find({
            terms,
            limit: options.limit,
            ...(options.unit === undefined ? {} : { unit: options.unit }),
          }),
        );
      }),
  );
  api.addCommand(
    new Command("show")
      .description("Show exact Facade classes, members, or types")
      .argument("<symbols...>", "one or more exact symbols")
      .action((symbols: string[]) => writeJson(reference.show(symbols))),
  );
  return api;
}

function createExecuteCommand(): Command {
  return new Command("execute")
    .description("Execute trusted Facade JavaScript and save the edited local Unit")
    .argument("<unit-file>", "local Unit JSON file")
    .option("--code <javascript>", "inline Facade JavaScript")
    .option("--file <script>", "read Facade JavaScript from a file")
    .action(async (file: string, options: ExecuteOptions) => {
      const code = await readExecutionCode(options);
      const path = resolve(file);
      const unit = await readLocalUnit(path);
      const runtime = await loadLocalRuntime(unit, license());
      try {
        const program = prepareContentExecutionProgram({
          code,
          unitId: unit.data.id,
          unitType: unit.unitType,
        });
        const result = await runtime.execute({ code: program, mode: "write" });
        const data = await runtime.exportUnitData();
        const updated = createLocalUnitForType(unit.unitType, data);
        await replaceLocalUnit(path, updated);
        writeJson({
          file: path,
          saved: true,
          unitId: unit.data.id,
          unitType: unit.unitType,
          value: result.value,
        });
      } finally {
        await runtime.close();
      }
    });
}

function createExportCommand(): Command {
  return new Command("export")
    .description("Export a local Unit to XLSX, CSV, TSV, DOCX, or PPTX")
    .argument("<unit-file>", "local Unit JSON file")
    .argument("<office-file>", "Office output path; its extension selects the format")
    .action(async (file: string, output: string) => {
      const path = resolve(file);
      const outputPath = resolve(output);
      const unit = await readLocalUnit(path);
      const result = await exportOfficeFile(unit, outputPath);
      writeJson({
        file: path,
        format: result.format,
        output: result.outputPath,
        unitId: unit.data.id,
        unitType: unit.unitType,
      });
    });
}

async function readExecutionCode(options: ExecuteOptions): Promise<string> {
  if ((options.code === undefined) === (options.file === undefined)) {
    throw new MiniCliError(
      "EXECUTION_INPUT_INVALID",
      "Specify exactly one of --code <javascript> or --file <script>",
    );
  }
  return options.code ?? (await readFile(resolve(options.file ?? ""), "utf8"));
}

function createLocalUnitForType(unitType: MiniUnitType, data: OfficeUnitData) {
  if (unitType === "sheet") return createLocalUnit("sheet", data);
  if (unitType === "doc") return createLocalUnit("doc", data);
  return createLocalUnit("slide", data);
}

function positiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError(
      `Expected a positive integer; received ${JSON.stringify(value)}`,
    );
  }
  return parsed;
}

function defaultName(path: string, type: MiniUnitType): string {
  const filename = basename(path)
    .replace(/\.unit\.json$/i, "")
    .replace(/\.json$/i, "");
  return filename.length > 0 ? filename : `Untitled ${type}`;
}

function license(): string {
  return process.env.UNIVER_LICENSE ?? "";
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, undefined, 2)}\n`);
}
