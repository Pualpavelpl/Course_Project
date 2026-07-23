import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import {
  blockAdminUserRecords,
  createRecruiterRecord,
  deleteAdminUserRecords,
  listAdminUserRecords,
  promoteRecruiterRecord,
  unblockAdminUserRecords,
} from "./admin-user.controller.js";
import {
  createRecruiterRequestSchema,
  listAdminUsersRequestSchema,
  mutateAdminUsersRequestSchema,
  promoteRecruiterRequestSchema,
} from "./admin-user.validation.js";

const adminUserRouter = Router();

adminUserRouter.use(authenticate, requireAdmin);
adminUserRouter.get(
  "/users",
  validateRequest(listAdminUsersRequestSchema),
  listAdminUserRecords,
);
adminUserRouter.patch(
  "/users/block",
  validateRequest(mutateAdminUsersRequestSchema),
  blockAdminUserRecords,
);
adminUserRouter.patch(
  "/users/unblock",
  validateRequest(mutateAdminUsersRequestSchema),
  unblockAdminUserRecords,
);
adminUserRouter.delete(
  "/users",
  validateRequest(mutateAdminUsersRequestSchema),
  deleteAdminUserRecords,
);
adminUserRouter.post(
  "/recruiters",
  validateRequest(createRecruiterRequestSchema),
  createRecruiterRecord,
);
adminUserRouter.post(
  "/recruiters/:recruiterId/promote",
  validateRequest(promoteRecruiterRequestSchema),
  promoteRecruiterRecord,
);

export default adminUserRouter;
