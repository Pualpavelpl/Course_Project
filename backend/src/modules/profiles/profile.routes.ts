import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authenticate,
  requireCandidate,
} from "../auth/auth.middleware.js";
import { authorizeOwnCandidateProfile } from "../auth/candidate-access.middleware.js";
import {
  createProfileAttributeRecord,
  deleteProfileAttributeRecord,
  getMyProfileRecord,
  listAvailableProfileAttributeRecords,
  updateMyProfileRecord,
  updateProfileAttributeRecord,
} from "./profile.controller.js";
import {
  createProfileAttributeRequestSchema,
  deleteProfileAttributeRequestSchema,
  getMyProfileRequestSchema,
  listAvailableProfileAttributesRequestSchema,
  updateMyProfileRequestSchema,
  updateProfileAttributeRequestSchema,
} from "./profile.validation.js";

const profileRouter = Router();

profileRouter.use(
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
);
profileRouter.get(
  "/me",
  validateRequest(getMyProfileRequestSchema),
  getMyProfileRecord,
);
profileRouter.patch(
  "/me",
  validateRequest(updateMyProfileRequestSchema),
  updateMyProfileRecord,
);
profileRouter.get(
  "/me/available-attributes",
  validateRequest(listAvailableProfileAttributesRequestSchema),
  listAvailableProfileAttributeRecords,
);
profileRouter.post(
  "/me/attributes",
  validateRequest(createProfileAttributeRequestSchema),
  createProfileAttributeRecord,
);
profileRouter.patch(
  "/me/attributes/:attributeId",
  validateRequest(updateProfileAttributeRequestSchema),
  updateProfileAttributeRecord,
);
profileRouter.delete(
  "/me/attributes/:attributeId",
  validateRequest(deleteProfileAttributeRequestSchema),
  deleteProfileAttributeRecord,
);

export default profileRouter;
