import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types.js";

export const publicCache = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=300");
});

export const prayerTimesCache = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=3600");
});

export const noStore = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});
