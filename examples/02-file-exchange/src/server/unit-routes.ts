import express from "express";
import { parseUnitType } from "../shared/unit.js";
import type { UnitService } from "./unit-service.js";

export function createUnitRouter(units: UnitService): express.Router {
  const router = express.Router();

  router.post("/", express.json(), async (request, response) => {
    const unitType = parseUnitType(request.body.type);
    const { name, unitId, data } = request.body;
    const result = await units.create({
      unitType,
      ...(name == null ? {} : { name: String(name) }),
      ...(unitId == null ? {} : { unitId: String(unitId) }),
      data,
    });
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
