import { Router } from "express";
import {
  getDatabaseHealth,
  getProcessHealth,
} from "../modules/health/health.controller.js";
import { healthRequestSchema } from "../modules/health/health.validation.js";
import { validateRequest } from "../middleware/validation.middleware.js";

const healthRouter = Router();

healthRouter.get("/", validateRequest(healthRequestSchema), getProcessHealth);
healthRouter.get(
  "/database",
  validateRequest(healthRequestSchema),
  getDatabaseHealth,
);

export default healthRouter;
