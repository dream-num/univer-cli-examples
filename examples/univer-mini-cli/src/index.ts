#!/usr/bin/env node

import { CommanderError } from "commander";
import { errorCode, errorMessage } from "./errors.js";
import { createProgram } from "./program.js";

try {
  await createProgram().parseAsync(process.argv);
} catch (error) {
  if (error instanceof CommanderError && error.exitCode === 0) {
    // Commander already wrote requested help to stdout.
  } else {
    process.stderr.write(
      `${JSON.stringify(
        { error: { code: errorCode(error), message: errorMessage(error) } },
        undefined,
        2,
      )}\n`,
    );
    process.exitCode = error instanceof CommanderError ? error.exitCode : 1;
  }
}
