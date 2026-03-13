import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types.js";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export const rateLimit = createMiddleware<AppEnv>(async (c, next) => {
  const key =
    c.req.header("X-Forwarded-For") ??
    c.req.header("X-Real-IP") ??
    "unknown";

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    c.header("Retry-After", retryAfter.toString());
    return c.json({ error: "Too many requests" }, 429);
  }

  entry.count++;
  await next();
});
