import express from "express";
import type { WorktreeRepository } from "./worktree-repository.js";

export function createWorktreeRouter(worktrees: WorktreeRepository): express.Router {
  const router = express.Router();
  router.get("/", (_request, response) => {
    response.json(worktrees.list());
  });
  return router;
}
