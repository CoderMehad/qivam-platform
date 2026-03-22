import { randomUUID } from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types.js";

export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const id = c.req.header("X-Request-Id") ?? randomUUID();
  c.set("requestId", id);
  await next();
  c.header("X-Request-Id", id);
});
