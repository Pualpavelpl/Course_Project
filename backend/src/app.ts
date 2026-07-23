import cors from "cors";
import express, { type Express, type Router } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { httpLogger } from "./lib/logger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import apiRouter from "./routes/index.js";

export function createApp(routes: Router = apiRouter): Express {
  const application = express();

  application.disable("x-powered-by");
  application.use(httpLogger);
  application.use(helmet());
  application.use(
    cors({
      origin: env.FRONTEND_URL,
    }),
  );
  application.use(express.json({ limit: "100kb" }));

  application.use("/api", routes);

  application.use(notFoundMiddleware);
  application.use(errorMiddleware);

  return application;
}

export const app = createApp();
