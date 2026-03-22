import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as Mosque from "@qivam/core/mosque";
import type { AppEnv } from "../types.js";
import { jwtAuth } from "../middleware/admin-auth.js";
import { requireOwnership } from "../middleware/ownership.js";
import {
  createMosque,
  updateMosque,
  mosqueResponse,
} from "@qivam/core/schemas/mosque";
import { errorResponse } from "@qivam/core/schemas/common";

export const mosqueAdminRoutes = new OpenAPIHono<AppEnv>();

const createMosqueRoute = createRoute({
  method: "post",
  path: "/",
  middleware: [jwtAuth],
  request: {
    body: { content: { "application/json": { schema: createMosque } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: mosqueResponse } },
      description: "Mosque created",
    },
    409: {
      content: { "application/json": { schema: errorResponse } },
      description: "Mosque already exists",
    },
  },
});

mosqueAdminRoutes.openapi(createMosqueRoute, async (c) => {
  const data = c.req.valid("json");
  const mosque = await Mosque.create(data);
  return c.json(mosque, 201);
});

const updateMosqueRoute = createRoute({
  method: "patch",
  path: "/{id}",
  middleware: [jwtAuth, requireOwnership()],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: updateMosque } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: mosqueResponse } },
      description: "Mosque updated",
    },
    404: {
      content: { "application/json": { schema: errorResponse } },
      description: "Mosque not found",
    },
  },
});

mosqueAdminRoutes.openapi(updateMosqueRoute, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const mosque = await Mosque.update(id, data);
  if (!mosque) {
    return c.json({ error: "Mosque not found" }, 404);
  }
  return c.json(mosque, 200);
});

const deleteMosqueRoute = createRoute({
  method: "delete",
  path: "/{id}",
  middleware: [jwtAuth, requireOwnership()],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
      description: "Mosque deleted",
    },
    404: {
      content: { "application/json": { schema: errorResponse } },
      description: "Mosque not found",
    },
  },
});

mosqueAdminRoutes.openapi(deleteMosqueRoute, async (c) => {
  const { id } = c.req.valid("param");
  const deleted = await Mosque.remove(id);
  if (!deleted) {
    return c.json({ error: "Mosque not found" }, 404);
  }
  return c.json({ success: true }, 200);
});
