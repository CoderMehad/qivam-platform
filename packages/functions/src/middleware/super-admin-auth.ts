import { timingSafeEqual } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { Config } from "sst/node/config";
import type { AppEnv } from "../types.js";

export const superAdminAuth = createMiddleware<AppEnv>(async (c, next) => {
  const key = c.req.header("X-Super-Admin-Key");
  if (!key) {
    return c.json({ error: "Missing X-Super-Admin-Key header" }, 401);
  }

  const expected = (Config as Record<string, string>).SUPER_ADMIN_KEY;
  if (!expected) {
    return c.json({ error: "Super admin key not configured" }, 500);
  }

  const a = Buffer.from(key);
  const b = Buffer.from(expected);

  if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
    return c.json({ error: "Invalid super admin key" }, 401);
  }

  await next();
});
