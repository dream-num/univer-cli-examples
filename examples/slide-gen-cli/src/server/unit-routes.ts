import express from "express";
import type { UnitService } from "./unit-service.js";

export function createUnitRouter(units: UnitService): express.Router {
  const router = express.Router();

  router.post("/", express.json(), async (request, response) => {
    const { name, unitId } = request.body;
    const result = await units.create(
      name == null ? undefined : String(name),
      unitId == null ? undefined : String(unitId),
    );
    if (result.status === "already-exists") {
      response.sendStatus(409);
      return;
    }
    response.status(201).json(result.unit);
  });
  router.get("/", (_request, response) => {
    response.json(units.list());
  });
  router.get("/:unitId", (request, response) => {
    const unit = units.findById(request.params.unitId);
    if (unit === undefined) {
      response.sendStatus(404);
      return;
    }
    response.json(unit);
  });

  return router;
}
