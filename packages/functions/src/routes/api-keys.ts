import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as ApiKey from "@openislam/core/api-key";
import type { AppEnv } from "../types.js";
import { requestApiKey } from "../schemas/api-key.js";

export const apiKeyRoutes = new Hono<AppEnv>();

apiKeyRoutes.post("/request", zValidator("json", requestApiKey), (c) => {
  const data = c.req.valid("json");
  const result = ApiKey.request(data);
  return c.json(result, 201);
});

apiKeyRoutes.get("/:prefix", (c) => {
  const prefix = c.req.param("prefix");
  const key = ApiKey.getByPrefix(prefix);
  if (!key) {
    return c.json({ error: "API key not found" }, 404);
  }
  return c.json(key);
});
