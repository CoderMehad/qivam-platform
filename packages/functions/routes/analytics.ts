import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as ApiKey from "@qivam/core/api-key";
import type { AppEnv } from "../types.js";
import { apiKeyAuth } from "../middleware/api-key.js";

export const analyticsRoutes = new OpenAPIHono<AppEnv>();

const messageSchema = z.object({ message: z.string() });

const optOutRoute = createRoute({
  method: "post",
  path: "/opt-out",
  middleware: [apiKeyAuth] as const,
  security: [{ apiKey: [] }],
  request: {},
  responses: {
    200: {
      content: { "application/json": { schema: messageSchema } },
      description: "Analytics logging disabled for this key",
    },
  },
});

analyticsRoutes.openapi(optOutRoute, async (c) => {
  const { id } = c.get("apiKey");
  await ApiKey.setAnalyticsEnabled(id, false);
  return c.json({ message: "Analytics logging disabled for this key" }, 200);
});

const optInRoute = createRoute({
  method: "post",
  path: "/opt-in",
  middleware: [apiKeyAuth] as const,
  security: [{ apiKey: [] }],
  request: {},
  responses: {
    200: {
      content: { "application/json": { schema: messageSchema } },
      description: "Analytics logging enabled for this key",
    },
  },
});

analyticsRoutes.openapi(optInRoute, async (c) => {
  const { id } = c.get("apiKey");
  await ApiKey.setAnalyticsEnabled(id, true);
  return c.json({ message: "Analytics logging enabled for this key" }, 200);
});
