import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authenticate,
  requireEmployee,
} from "../auth/auth.middleware.js";
import {
  createAttributeRecord,
  deleteAttributeRecord,
  getAttributeRecord,
  listAttributeRecords,
  updateAttributeRecord,
} from "./attribute.controller.js";
import {
  createAttributeRequestSchema,
  deleteAttributeRequestSchema,
  getAttributeRequestSchema,
  listAttributesRequestSchema,
  updateAttributeRequestSchema,
} from "./attribute.validation.js";

const attributeRouter = Router();

attributeRouter.use(authenticate, requireEmployee);
attributeRouter.get(
  "/",
  validateRequest(listAttributesRequestSchema),
  listAttributeRecords,
);
attributeRouter.get(
  "/:id",
  validateRequest(getAttributeRequestSchema),
  getAttributeRecord,
);
attributeRouter.post(
  "/",
  validateRequest(createAttributeRequestSchema),
  createAttributeRecord,
);
attributeRouter.patch(
  "/:id",
  validateRequest(updateAttributeRequestSchema),
  updateAttributeRecord,
);
attributeRouter.delete(
  "/:id",
  validateRequest(deleteAttributeRequestSchema),
  deleteAttributeRecord,
);

export default attributeRouter;
