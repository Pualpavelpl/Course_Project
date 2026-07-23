import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authenticate,
  requireCandidate,
  requireEmployee,
} from "../auth/auth.middleware.js";
import {
  createPositionRecord,
  deletePositionRecord,
  getAvailablePositionRecord,
  getPositionRecord,
  listAvailablePositionRecords,
  listPositionRecords,
  updatePositionRecord,
} from "./position.controller.js";
import {
  createPositionRequestSchema,
  deletePositionRequestSchema,
  getPositionRequestSchema,
  listPositionsRequestSchema,
  updatePositionRequestSchema,
} from "./position.validation.js";

const positionRouter = Router();

positionRouter.get(
  "/available",
  authenticate,
  requireCandidate,
  validateRequest(listPositionsRequestSchema),
  listAvailablePositionRecords,
);
positionRouter.get(
  "/available/:id",
  authenticate,
  requireCandidate,
  validateRequest(getPositionRequestSchema),
  getAvailablePositionRecord,
);
positionRouter.get(
  "/",
  authenticate,
  requireEmployee,
  validateRequest(listPositionsRequestSchema),
  listPositionRecords,
);
positionRouter.get(
  "/:id",
  authenticate,
  requireEmployee,
  validateRequest(getPositionRequestSchema),
  getPositionRecord,
);
positionRouter.post(
  "/",
  authenticate,
  requireEmployee,
  validateRequest(createPositionRequestSchema),
  createPositionRecord,
);
positionRouter.patch(
  "/:id",
  authenticate,
  requireEmployee,
  validateRequest(updatePositionRequestSchema),
  updatePositionRecord,
);
positionRouter.delete(
  "/:id",
  authenticate,
  requireEmployee,
  validateRequest(deletePositionRequestSchema),
  deletePositionRecord,
);

export default positionRouter;
