import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authenticate,
  requireEmployee,
} from "../auth/auth.middleware.js";
import { listTagRecords } from "./tag.controller.js";
import { listTagsRequestSchema } from "./tag.validation.js";

const tagRouter = Router();

tagRouter.get(
  "/",
  authenticate,
  requireEmployee,
  validateRequest(listTagsRequestSchema),
  listTagRecords,
);

export default tagRouter;
