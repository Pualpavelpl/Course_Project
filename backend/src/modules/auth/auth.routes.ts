import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  getCurrentSession,
  loginCandidateAccount,
  loginRecruiterAccount,
  registerCandidateAccount,
} from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import {
  candidateRegistrationRequestSchema,
  loginRequestSchema,
  sessionRequestSchema,
} from "./auth.validation.js";

const authRouter = Router();

authRouter.post(
  "/candidates/register",
  validateRequest(candidateRegistrationRequestSchema),
  registerCandidateAccount,
);
authRouter.post(
  "/candidates/login",
  validateRequest(loginRequestSchema),
  loginCandidateAccount,
);
authRouter.post(
  "/recruiters/login",
  validateRequest(loginRequestSchema),
  loginRecruiterAccount,
);
authRouter.get(
  "/session",
  validateRequest(sessionRequestSchema),
  authenticate,
  getCurrentSession,
);

export default authRouter;
