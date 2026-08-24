import { Argument, Command } from "commander";
import launch from "open";
import { UNIT_TYPES, type UnitType } from "../../shared/unit.js";
import { createUnitUrl, DEFAULT_SERVER_URL, viewerUrl } from "../../shared/urls.js";

interface CreateOptions {
  readonly name: string;
}

interface OpenOptions {
  readonly launch: boolean;
  readonly unit: string;
}

export function createUnitCommand(): Command {
  const command = new Command("create")
    .description("Create a collaborative Unit")
    .addArgument(new Argument("<type>", "Unit type").choices(UNIT_TYPES))
    .option("--name <name>", "Unit name", "Untitled")
    .action(async (type: UnitType, options: CreateOptions) => {
      const response = await fetch(createUnitUrl(DEFAULT_SERVER_URL), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: options.name, type }),
      });
      process.stdout.write(`${JSON.stringify(await response.json(), undefined, 2)}\n`);
    });
  return command;
}

export function openUnitCommand(): Command {
  const command = new Command("open")
    .description("Open the Unit in the Web editor")
    .requiredOption("--unit <id>", "Unit id")
    .option("--no-launch", "print the URL without opening a browser")
    .action(async (options: OpenOptions) => {
      const url = viewerUrl(DEFAULT_SERVER_URL, options.unit);
      if (options.launch) await launch(url);
      process.stdout.write(`${url}\n`);
    });
  return command;
}
