import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";

export const httpLogger = pinoHttp({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  autoLogging: env.NODE_ENV !== "test",
  quietReqLogger: true,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
});

export const logger = httpLogger.logger;
