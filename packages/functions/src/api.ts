import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { handle } from "hono/aws-lambda";
import type { AppEnv } from "./types.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { mosqueRoutes } from "./routes/mosques.js";
import { prayerTimesRoutes } from "./routes/prayer-times.js";
import { apiKeyRoutes } from "./routes/api-keys.js";

const app = new OpenAPIHono<AppEnv>();

app.use("*", cors());
app.use("*", rateLimit);

app.route("/", healthRoutes);
app.route("/auth", authRoutes);
app.route("/mosques", mosqueRoutes);
app.route("/mosques", prayerTimesRoutes);
app.route("/api-keys", apiKeyRoutes);

app.doc("/docs", {
  openapi: "3.1.0",
  info: { title: "OpenIslam API", version: "0.1.0" },
});

export const handler = handle(app);
