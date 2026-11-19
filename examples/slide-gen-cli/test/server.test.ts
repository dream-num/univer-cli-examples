import { WorktreeClient } from "@univerjs-pro/collaboration-worktree-client";
import { beforeEach, expect, it } from "vitest";
import { startTestServer } from "./start-test-server.js";

let origin: string;

beforeEach(async () => {
  ({ origin } = await startTestServer());
});

it("creates only empty Slide units and keeps unit and Worktree routes available", async () => {
  const ticket = await fetch(`${origin}/universer-api/user/session-ticket`);
  expect(ticket.status).toBe(200);
  expect(await ticket.json()).toMatchObject({ ticket: expect.any(String) });
  const fallback = await fetch(`${origin}/universer-api/not-an-endpoint`);
  expect(fallback.status).toBe(200);
  expect(await fallback.text()).toContain('id="sidebar"');

  const unnamed = await create({});
  expect(unnamed).toMatchObject({ name: "Untitled Slide", unitType: "slide", revision: 1 });

  const named = await create({ unitId: "named-slide", name: "Named Slide" });
  expect(named).toMatchObject({ unitId: "named-slide", name: "Named Slide", unitType: "slide" });

  const legacy = await create({
    unitId: "legacy-input",
    name: "Still a Slide",
    type: "sheet",
    data: { id: "forged-sheet", sheets: { sheet1: {} } },
  });
  expect(legacy).toMatchObject({
    unitId: "legacy-input",
    name: "Still a Slide",
    unitType: "slide",
  });

  expect(await getJson("/api/units/named-slide")).toEqual({
    unitId: "named-slide",
    name: "Named Slide",
    unitType: "slide",
  });
  expect(await getJson("/api/units")).toEqual([
    { unitId: legacy.unitId, name: legacy.name, unitType: "slide" },
    { unitId: named.unitId, name: named.name, unitType: "slide" },
    { unitId: unnamed.unitId, name: unnamed.name, unitType: "slide" },
  ]);
  expect(await getJson("/api/worktrees")).toEqual([]);
  const client = new WorktreeClient({ origin });
  await client.createWorktree({ worktreeID: "z-draft", units: ["named-slide"] });
  await client.createWorktree({ worktreeID: "a-empty" });
  await client.markReady("z-draft");
  expect(await getJson("/api/worktrees")).toEqual([
    { worktreeID: "a-empty", status: "draft", units: [] },
    { worktreeID: "z-draft", status: "ready", units: [{ unitID: "named-slide" }] },
  ]);
});

async function create(body: object): Promise<Record<string, unknown>> {
  const response = await fetch(`${origin}/api/units`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Record<string, unknown>;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${origin}${path}`);
  expect(response.status).toBe(200);
  return await response.json();
}
