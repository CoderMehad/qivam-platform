import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { pingDb } from "@qivam/core/db/connection";
import type { AppEnv } from "../types.js";

export const healthRoutes = new OpenAPIHono<AppEnv>();

const healthRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            database: z.string(),
          }),
        },
      },
      description: "Service healthy",
    },
    503: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            database: z.string(),
          }),
        },
      },
      description: "Service degraded",
    },
  },
});

healthRoutes.openapi(healthRoute, async (c) => {
  try {
    await pingDb();
    return c.json({ status: "ok", database: "connected" }, 200);
  } catch (err) {
    console.error("Health check DB error:", err);
    return c.json({ status: "degraded", database: "unreachable" }, 503);
  }
});
