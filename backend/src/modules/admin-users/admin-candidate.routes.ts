import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authorizeAdminCandidateProfile,
} from "../auth/candidate-access.middleware.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import {
  createCvRecord,
  deleteCvRecord,
  getCandidateCvRecord,
  listCandidateCvRecords,
  updateCvProfileAttributeRecords,
} from "../cvs/cv.controller.js";
import {
  createProfileAttributeRecord,
  deleteProfileAttributeRecord,
  getMyProfileRecord,
  listAvailableProfileAttributeRecords,
  updateMyProfileRecord,
  updateProfileAttributeRecord,
} from "../profiles/profile.controller.js";
import {
  createProjectRecord,
  deleteProjectRecord,
  getProjectRecord,
  listProjectRecords,
  updateProjectRecord,
} from "../projects/project.controller.js";
import {
  adminCreateCvRequestSchema,
  adminCreateProfileAttributeRequestSchema,
  adminCreateProjectRequestSchema,
  adminDeleteCvRequestSchema,
  adminDeleteProfileAttributeRequestSchema,
  adminDeleteProjectRequestSchema,
  adminGetCvRequestSchema,
  adminGetProfileRequestSchema,
  adminGetProjectRequestSchema,
  adminListAvailableAttributesRequestSchema,
  adminListCvsRequestSchema,
  adminListProjectsRequestSchema,
  adminUpdateCvRequestSchema,
  adminUpdateProfileAttributeRequestSchema,
  adminUpdateProfileRequestSchema,
  adminUpdateProjectRequestSchema,
} from "./admin-candidate.validation.js";

const adminCandidateRouter = Router({ mergeParams: true });

adminCandidateRouter.use(
  authenticate,
  requireAdmin,
  authorizeAdminCandidateProfile,
);

adminCandidateRouter.get(
  "/profile",
  validateRequest(adminGetProfileRequestSchema),
  getMyProfileRecord,
);
adminCandidateRouter.patch(
  "/profile",
  validateRequest(adminUpdateProfileRequestSchema),
  updateMyProfileRecord,
);
adminCandidateRouter.get(
  "/profile/available-attributes",
  validateRequest(adminListAvailableAttributesRequestSchema),
  listAvailableProfileAttributeRecords,
);
adminCandidateRouter.post(
  "/profile/attributes",
  validateRequest(adminCreateProfileAttributeRequestSchema),
  createProfileAttributeRecord,
);
adminCandidateRouter.patch(
  "/profile/attributes/:attributeId",
  validateRequest(adminUpdateProfileAttributeRequestSchema),
  updateProfileAttributeRecord,
);
adminCandidateRouter.delete(
  "/profile/attributes/:attributeId",
  validateRequest(adminDeleteProfileAttributeRequestSchema),
  deleteProfileAttributeRecord,
);

adminCandidateRouter.get(
  "/projects",
  validateRequest(adminListProjectsRequestSchema),
  listProjectRecords,
);
adminCandidateRouter.get(
  "/projects/:projectId",
  validateRequest(adminGetProjectRequestSchema),
  getProjectRecord,
);
adminCandidateRouter.post(
  "/projects",
  validateRequest(adminCreateProjectRequestSchema),
  createProjectRecord,
);
adminCandidateRouter.patch(
  "/projects/:projectId",
  validateRequest(adminUpdateProjectRequestSchema),
  updateProjectRecord,
);
adminCandidateRouter.delete(
  "/projects/:projectId",
  validateRequest(adminDeleteProjectRequestSchema),
  deleteProjectRecord,
);

adminCandidateRouter.get(
  "/cvs",
  validateRequest(adminListCvsRequestSchema),
  listCandidateCvRecords,
);
adminCandidateRouter.post(
  "/cvs",
  validateRequest(adminCreateCvRequestSchema),
  createCvRecord,
);
adminCandidateRouter.get(
  "/cvs/:cvId",
  validateRequest(adminGetCvRequestSchema),
  getCandidateCvRecord,
);
adminCandidateRouter.patch(
  "/cvs/:cvId/profile-attributes",
  validateRequest(adminUpdateCvRequestSchema),
  updateCvProfileAttributeRecords,
);
adminCandidateRouter.delete(
  "/cvs/:cvId",
  validateRequest(adminDeleteCvRequestSchema),
  deleteCvRecord,
);

export default adminCandidateRouter;
