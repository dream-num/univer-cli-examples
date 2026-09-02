export const DEFAULT_SERVER_URL = "http://127.0.0.1:3010";

export function collaborationUrls(serverUrl: string): {
  readonly collabSubmitChangesetUrl: string;
  readonly collabWebSocketUrl: string;
  readonly snapshotServerUrl: string;
  readonly wsSessionTicketUrl: string;
} {
  const http = new URL("/universer-api/", serverUrl);
  const socket = new URL("comb/connect", http);
  socket.protocol = socket.protocol === "https:" ? "wss:" : "ws:";
  return {
    collabSubmitChangesetUrl: new URL("comb", http).toString(),
    collabWebSocketUrl: socket.toString(),
    snapshotServerUrl: new URL("snapshot", http).toString(),
    wsSessionTicketUrl: new URL("user/session-ticket", http).toString(),
  };
}

export function createUnitUrl(serverUrl: string): string {
  return new URL("/api/units", serverUrl).toString();
}

export function worktreesUrl(serverUrl: string): string {
  return new URL("/api/worktrees", serverUrl).toString();
}

export function unitUrl(serverUrl: string, unitId: string): string {
  return new URL(`/api/units/${encodeURIComponent(unitId)}`, serverUrl).toString();
}

export function viewerUrl(serverUrl: string, unitId: string, worktreeId?: string): string {
  const url = new URL(serverUrl);
  url.searchParams.set("unit", unitId);
  if (worktreeId !== undefined) url.searchParams.set("worktree", worktreeId);
  return url.toString();
}
