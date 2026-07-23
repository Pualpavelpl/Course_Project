import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authenticate,
  requireCandidate,
  requireEmployee,
} from "../auth/auth.middleware.js";
import { authorizeOwnCandidateProfile } from "../auth/candidate-access.middleware.js";
import {
  addCvLikeRecord,
  createCvRecord,
  deleteCvRecord,
  getCandidateCvRecord,
  getRecruiterCvRecord,
  listCandidateCvRecords,
  listRecruiterCvRecords,
  removeCvLikeRecord,
  updateCvProfileAttributeRecords,
} from "./cv.controller.js";
import {
  createCvRequestSchema,
  deleteCvRequestSchema,
  getCvRequestSchema,
  listCvsRequestSchema,
  listRecruiterCvsRequestSchema,
  updateCvProfileAttributesRequestSchema,
} from "./cv.validation.js";

const cvRouter = Router();

cvRouter.get(
  "/search",
  authenticate,
  requireEmployee,
  validateRequest(listRecruiterCvsRequestSchema),
  listRecruiterCvRecords,
);
cvRouter.get(
  "/search/:cvId",
  authenticate,
  requireEmployee,
  validateRequest(getCvRequestSchema),
  getRecruiterCvRecord,
);
cvRouter.post(
  "/:cvId/like",
  authenticate,
  requireEmployee,
  validateRequest(getCvRequestSchema),
  addCvLikeRecord,
);
cvRouter.delete(
  "/:cvId/like",
  authenticate,
  requireEmployee,
  validateRequest(getCvRequestSchema),
  removeCvLikeRecord,
);
cvRouter.get(
  "/",
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
  validateRequest(listCvsRequestSchema),
  listCandidateCvRecords,
);
cvRouter.post(
  "/",
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
  validateRequest(createCvRequestSchema),
  createCvRecord,
);
cvRouter.get(
  "/:cvId",
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
  validateRequest(getCvRequestSchema),
  getCandidateCvRecord,
);
cvRouter.patch(
  "/:cvId/profile-attributes",
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
  validateRequest(updateCvProfileAttributesRequestSchema),
  updateCvProfileAttributeRecords,
);
cvRouter.delete(
  "/:cvId",
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
  validateRequest(deleteCvRequestSchema),
  deleteCvRecord,
);

export default cvRouter;
