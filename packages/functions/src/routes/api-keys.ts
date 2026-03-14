import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as ApiKey from "@qivam/core/api-key";
import type { AppEnv } from "../types.js";
import { requestApiKey, apiKeyResponse, apiKeyStatus } from "../schemas/api-key.js";
import { errorResponse } from "../schemas/common.js";

export const apiKeyRoutes = new OpenAPIHono<AppEnv>();

const requestRoute = createRoute({
  method: "post",
  path: "/request",
  request: {
    body: { content: { "application/json": { schema: requestApiKey } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: apiKeyResponse } },
      description: "API key created (inactive until approved)",
    },
  },
});

apiKeyRoutes.openapi(requestRoute, async (c) => {
  const data = c.req.valid("json");
  const result = await ApiKey.request(data);
  return c.json(result, 201);
});

const statusRoute = createRoute({
  method: "get",
  path: "/{prefix}",
  request: {
    params: z.object({ prefix: z.string() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiKeyStatus } },
      description: "API key status",
    },
    404: {
      content: { "application/json": { schema: errorResponse } },
      description: "API key not found",
    },
  },
});

apiKeyRoutes.openapi(statusRoute, async (c) => {
  const { prefix } = c.req.valid("param");
  const key = await ApiKey.getByPrefix(prefix);
  if (!key) {
    return c.json({ error: "API key not found" }, 404);
  }
  return c.json(key, 200);
});
