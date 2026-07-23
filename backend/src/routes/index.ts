import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import adminCandidateRouter from "../modules/admin-users/admin-candidate.routes.js";
import adminUserRouter from "../modules/admin-users/admin-user.routes.js";
import attributeRouter from "../modules/attributes/attribute.routes.js";
import cvRouter from "../modules/cvs/cv.routes.js";
import positionRouter from "../modules/positions/position.routes.js";
import profileRouter from "../modules/profiles/profile.routes.js";
import projectRouter from "../modules/projects/project.routes.js";
import tagRouter from "../modules/tags/tag.routes.js";
import healthRouter from "./health.routes.js";
import helloRouter from "./hello.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(
  "/admin/candidates/:candidateId",
  adminCandidateRouter,
);
apiRouter.use("/admin", adminUserRouter);
apiRouter.use("/attributes", attributeRouter);
apiRouter.use("/cvs", cvRouter);
apiRouter.use("/positions", positionRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/profile", projectRouter);
apiRouter.use("/tags", tagRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/hello", helloRouter);

export default apiRouter;
