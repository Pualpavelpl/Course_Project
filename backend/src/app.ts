import cors from "cors";
import express, { type Express, type Router } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { httpLogger } from "./lib/logger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import apiRouter from "./routes/index.js";

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function isAllowedOrigin(
  origin: string,
  allowedOrigins: string[],
): boolean {
  return allowedOrigins.some((allowedOrigin) => {
    const pattern = allowedOrigin
      .split("*")
      .map(escapeRegularExpression)
      .join("[a-zA-Z0-9-]+");

    return new RegExp(`^${pattern}$`, "u").test(origin);
  });
}

export function createApp(
  routes: Router = apiRouter,
  allowedOrigins: string[] = env.FRONTEND_URL,
): Express {
  const application = express();

  application.disable("x-powered-by");
  application.use(httpLogger);
  application.use(helmet());
  application.use(
    cors({
      origin(origin, callback) {
        callback(
          null,
          origin === undefined ||
            isAllowedOrigin(origin, allowedOrigins),
        );
      },
    }),
  );
  application.use(express.json({ limit: "100kb" }));

  application.use("/api", routes);

  application.use(notFoundMiddleware);
  application.use(errorMiddleware);

  return application;
}

export const app = createApp();
