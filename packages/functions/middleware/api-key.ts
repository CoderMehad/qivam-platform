import { createMiddleware } from "hono/factory";
import { validate } from "@qivam/core/api-key";
import type { AppEnv } from "../types.js";

export const apiKeyAuth = createMiddleware<AppEnv>(async (c, next) => {
  const key = c.req.header("X-API-Key");
  if (!key) {
    return c.json({ error: "Missing X-API-Key header" }, 401);
  }

  const result = await validate(key);
  if (!result) {
    return c.json({ error: "Invalid or inactive API key" }, 401);
  }

  c.set("apiKey", result);
  await next();
});
