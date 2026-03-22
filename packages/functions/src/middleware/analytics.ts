import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types.js";
import { log } from "../lib/logger.js";

export const requestAnalytics = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  await next();

  // Skip if analytics is disabled for this key
  const apiKeyCtx = c.get("apiKey");
  if (apiKeyCtx && !apiKeyCtx.analyticsEnabled) return;

  const rawKey = c.req.header("X-API-Key") ?? null;
  const sizeHeader = c.res.headers.get("content-length");

  log("info", "api_request", {
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    responseTimeMs: Date.now() - start,
    responseSizeBytes: sizeHeader ? Number(sizeHeader) : null,
    keyPrefix: rawKey ? rawKey.slice(-8) : null,
    userAgent: c.req.header("user-agent") ?? null,
    clientIp: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });
});
