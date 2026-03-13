import { createMiddleware } from "hono/factory";
import { verifyToken } from "@openislam/core/auth";
import type { AppEnv } from "../types.js";

export const jwtAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = header.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("admin", { id: payload.sub, mosqueId: payload.mosqueId });
  await next();
});
