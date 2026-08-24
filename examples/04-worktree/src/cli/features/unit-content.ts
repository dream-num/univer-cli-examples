import { readFile } from "node:fs/promises";
import { prepareContentExecutionProgram } from "@univer-cli/content-execution";
import {
  createWorktreeContentInspectionCommand,
  type ContentInspectionLease,
} from "@univer-cli/content-inspection-command";
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createCollaborationServerAdapter,
  createUniverCollaborationRuntimeFactory,
  type UniverCollaborationRuntime,
} from "@univer-cli/univer-collaboration-runtime";
import { createWorktreeCollaborationConfig } from "@univerjs-pro/collaboration-worktree-client";
import { Command } from "commander";
import { fromInstanceType, parseUnitType, toInstanceType } from "../../shared/unit.js";
import { collaborationUrls, DEFAULT_SERVER_URL, unitUrl } from "../../shared/urls.js";

interface ExecuteOptions {
  readonly code?: string;
  readonly file?: string;
  readonly unit: string;
  readonly worktree: string;
}

export function inspectCommand(): Command {
  return createWorktreeContentInspectionCommand({
    acquireRuntime: async ({ unitId, worktreeID }) =>
      await acquireInspectionRuntime(DEFAULT_SERVER_URL, unitId, worktreeID),
  });
}

export function executeCommand(): Command {
  const command = new Command("execute")
    .description("Execute trusted Facade JavaScript and commit once")
    .requiredOption("--unit <id>", "Unit id")
    .requiredOption("--worktree <id>", "Worktree to edit")
    .option("--code <javascript>", "inline Facade JavaScript")
    .option("--file <path>", "read Facade JavaScript from a file")
    .action(async (options: ExecuteOptions) => {
      if (options.code === undefined && options.file === undefined) {
        throw new Error("Specify --code or --file");
      }
      const code = options.code ?? (await readFile(options.file!, "utf8"));
      const runtime = await loadRuntime(DEFAULT_SERVER_URL, options.unit, options.worktree);
      try {
        const program = prepareContentExecutionProgram({
          code,
          unitId: options.unit,
          unitType: fromInstanceType(runtime.unitType),
        });
        const execution = await runtime.execute({ code: program, mode: "write" });
        const commit = await runtime.commit();
        process.stdout.write(
          `${JSON.stringify(
            {
              commit: commit.status,
              mutations: execution.mutations.length,
              revision: commit.state.baseRevision,
              value: execution.value,
            },
            undefined,
            2,
          )}\n`,
        );
      } finally {
        await runtime.close();
      }
    });
  return command;
}

export async function loadRuntime(
  serverUrl: string,
  unitId: string,
  worktreeID?: string,
): Promise<UniverCollaborationRuntime> {
  const response = await fetch(unitUrl(serverUrl, unitId));
  const { unitType } = (await response.json()) as { readonly unitType: unknown };
  const urls =
    worktreeID === undefined
      ? collaborationUrls(serverUrl)
      : createWorktreeCollaborationConfig({ origin: serverUrl, worktreeID });
  const factory = createUniverCollaborationRuntimeFactory({
    backend: createCollaborationServerAdapter({
      snapshotServerUrl: urls.snapshotServerUrl!,
      collabSubmitChangesetUrl: urls.collabSubmitChangesetUrl!,
      collabWebSocketUrl: urls.collabWebSocketUrl!,
      wsSessionTicketUrl: urls.wsSessionTicketUrl!,
    }),
    createUniver: createStandardHeadlessUniverFactory({
      license: process.env["UNIVER_LICENSE"] ?? "",
    }),
  });
  const runtime = await factory.load(unitId, toInstanceType(parseUnitType(unitType)));
  await runtime.pull();
  return runtime;
}

async function acquireInspectionRuntime(
  serverUrl: string,
  unitId: string,
  worktreeID?: string,
): Promise<ContentInspectionLease> {
  const runtime = await loadRuntime(serverUrl, unitId, worktreeID);
  return {
    unitId,
    unitType: fromInstanceType(runtime.unitType),
    execute: async (input) => {
      const result = await runtime.execute(input);
      return { value: result.value };
    },
    invalidate: async () => await runtime.close(),
    release: async () => await runtime.close(),
  };
}
