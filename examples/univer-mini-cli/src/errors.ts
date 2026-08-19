export class MiniCliError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "MiniCliError";
  }
}

export function errorCode(error: unknown): string {
  if (hasStringCode(error)) return error.code;
  return "UNIVER_MINI_FAILED";
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasStringCode(error: unknown): error is { readonly code: string } {
  return (
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
  );
}
