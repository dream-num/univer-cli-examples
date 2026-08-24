import { randomUUID } from "node:crypto";
import { WorktreeClient } from "@univerjs-pro/collaboration-worktree-client";
import { Command } from "commander";
import { DEFAULT_SERVER_URL } from "../../shared/urls.js";

export function worktreeCommand(): Command {
  const command = new Command("worktree").description("Create and finish an isolated Worktree");

  command
    .command("create")
    .description("Create a Worktree for one trunk Unit")
    .requiredOption("--unit <id>", "trunk Unit id")
    .action(async (options: { readonly unit: string }) => {
      const worktreeID = randomUUID().slice(0, 8);
      await new WorktreeClient({ origin: DEFAULT_SERVER_URL }).createWorktree({
        worktreeID,
        units: [options.unit],
      });
      process.stdout.write(`${worktreeID}\n`);
    });

  command
    .command("ready")
    .description("Mark a Worktree ready for human review")
    .argument("<worktree-id>")
    .action(async (worktreeID: string) => {
      const worktree = await new WorktreeClient({ origin: DEFAULT_SERVER_URL }).markReady(
        worktreeID,
      );
      process.stdout.write(`${JSON.stringify(worktree, undefined, 2)}\n`);
    });

  return command;
}
