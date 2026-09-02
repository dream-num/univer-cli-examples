import { Command, Option } from "commander";
import launch from "open";
import { createUnitUrl, DEFAULT_SERVER_URL, viewerUrl } from "../../shared/urls.js";

interface CreateOptions {
  readonly name: string;
}

interface OpenOptions {
  readonly launch: boolean;
  readonly trunk?: boolean;
  readonly unit: string;
  readonly worktree?: string;
}

export function createUnitCommand(): Command {
  const command = new Command("create")
    .description("Create a collaborative Slide")
    .option("--name <name>", "Slide name", "Untitled Slide")
    .action(async (options: CreateOptions) => {
      const response = await fetch(createUnitUrl(DEFAULT_SERVER_URL), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: options.name }),
      });
      const { unitId } = (await response.json()) as { readonly unitId: string };
      process.stdout.write(`${unitId}\n`);
    });
  return command;
}

export function openUnitCommand(): Command {
  const command = new Command("open")
    .description("Open the Unit in the Web editor")
    .requiredOption("--unit <id>", "Unit id")
    .addOption(new Option("--trunk", "open the trunk").conflicts("worktree"))
    .addOption(new Option("--worktree <id>", "open a Worktree draft").conflicts("trunk"))
    .option("--no-launch", "print the URL without opening a browser")
    .action(async (options: OpenOptions) => {
      if (options.trunk !== true && options.worktree === undefined) {
        throw new Error("Specify --trunk or --worktree <id>");
      }
      const url = viewerUrl(DEFAULT_SERVER_URL, options.unit, options.worktree);
      if (options.launch) await launch(url);
      process.stdout.write(`${url}\n`);
    });
  return command;
}
