import { Config } from "sst/node/config";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { handle } from "hono/aws-lambda";
import type { AppEnv } from "./types.js";
import { requestId } from "./middleware/request-id.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { mosqueRoutes } from "./routes/mosques.js";
import { mosqueAdminRoutes } from "./routes/mosques-admin.js";
import { prayerTimesRoutes } from "./routes/prayer-times.js";
import { prayerTimesAdminRoutes } from "./routes/prayer-times-admin.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { log } from "./lib/logger.js";

// Bridge SST Config.Secret values into process.env for core layer
process.env.NEON_DATABASE_URL ??= (Config as Record<string, string>).NEON_DATABASE_URL;
process.env.JWT_SECRET ??= (Config as Record<string, string>).JWT_SECRET;

const app = new OpenAPIHono<AppEnv>();

// ── Global middleware ────────────────────────────────────────────────────────

const stage = process.env.SST_STAGE ?? "dev";
const isProduction = stage === "production";

app.use(
  "*",
  cors({
    origin: isProduction
      ? ["https://qivam.com", "https://www.qivam.com", "https://docs.qivam.com"]
      : "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-Id"],
    maxAge: 86400,
  }),
);

app.use("*", requestId);

// ── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  const reqId = c.get("requestId");
  const message = err instanceof Error ? err.message : "Internal server error";

  if (message === "Email already registered" || message.includes("already exists")) {
    return c.json({ error: message, requestId: reqId }, 409);
  }
  if (message.includes("not found")) {
    return c.json({ error: message, requestId: reqId }, 404);
  }

  log("error", "Unhandled error", { error: message, requestId: reqId });
  return c.json({ error: "Internal server error", requestId: reqId }, 500);
});

// ── Consumer routes (documented in OpenAPI spec) ─────────────────────────────

const consumerApp = new OpenAPIHono<AppEnv>();
consumerApp.route("/mosques", mosqueRoutes);
consumerApp.route("/mosques", prayerTimesRoutes);
consumerApp.route("/api-keys", apiKeyRoutes);

consumerApp.doc("/docs/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Qivam API",
    description: "Public API for accessing the mosque directory and prayer times. All endpoints require an API key via the X-API-Key header.",
    version: "1.0.0",
  },
  servers: [{ url: "/v1" }],
});

consumerApp.get(
  "/docs",
  apiReference({
    url: "/v1/docs/openapi.json",
    theme: "kepler",
    pageTitle: "Qivam API Docs",
  }),
);

// ── Routes ───────────────────────────────────────────────────────────────────

// Unversioned health check for load balancers
app.route("/", healthRoutes);

// Consumer API with docs
app.route("/v1", consumerApp);

// Admin routes (JWT-protected, not in docs — managed via dashboard)
app.route("/v1/auth", authRoutes);
app.route("/v1/mosques", mosqueAdminRoutes);
app.route("/v1/mosques", prayerTimesAdminRoutes);

export const handler = handle(app);
