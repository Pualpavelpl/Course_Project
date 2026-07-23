import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  authenticate,
  requireCandidate,
} from "../auth/auth.middleware.js";
import { authorizeOwnCandidateProfile } from "../auth/candidate-access.middleware.js";
import {
  createProjectRecord,
  deleteProjectRecord,
  getProjectRecord,
  listProjectRecords,
  updateProjectRecord,
} from "./project.controller.js";
import {
  createProjectRequestSchema,
  deleteProjectRequestSchema,
  getProjectRequestSchema,
  listProjectsRequestSchema,
  updateProjectRequestSchema,
} from "./project.validation.js";

const projectRouter = Router();

projectRouter.use(
  authenticate,
  requireCandidate,
  authorizeOwnCandidateProfile,
);
projectRouter.get(
  "/me/projects",
  validateRequest(listProjectsRequestSchema),
  listProjectRecords,
);
projectRouter.get(
  "/me/projects/:projectId",
  validateRequest(getProjectRequestSchema),
  getProjectRecord,
);
projectRouter.post(
  "/me/projects",
  validateRequest(createProjectRequestSchema),
  createProjectRecord,
);
projectRouter.patch(
  "/me/projects/:projectId",
  validateRequest(updateProjectRequestSchema),
  updateProjectRecord,
);
projectRouter.delete(
  "/me/projects/:projectId",
  validateRequest(deleteProjectRequestSchema),
  deleteProjectRecord,
);

export default projectRouter;
