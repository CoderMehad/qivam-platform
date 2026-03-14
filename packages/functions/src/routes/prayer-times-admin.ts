import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as PrayerTimes from "@openislam/core/prayer-times";
import type { AppEnv } from "../types.js";
import { jwtAuth } from "../middleware/admin-auth.js";
import { requireOwnership } from "../middleware/ownership.js";
import {
  createPrayerTimes,
  bulkSchema,
  prayerTimesResponse,
} from "../schemas/prayer-times.js";

export const prayerTimesAdminRoutes = new OpenAPIHono<AppEnv>();

const upsertRoute = createRoute({
  method: "post",
  path: "/{id}/prayer-times",
  middleware: [jwtAuth, requireOwnership()],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: createPrayerTimes } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: prayerTimesResponse } },
      description: "Prayer time upserted",
    },
  },
});

prayerTimesAdminRoutes.openapi(upsertRoute, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const entry = await PrayerTimes.upsert(id, data);
  return c.json(entry, 201);
});

const bulkRoute = createRoute({
  method: "post",
  path: "/{id}/prayer-times/bulk",
  middleware: [jwtAuth, requireOwnership()],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: bulkSchema } } },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(prayerTimesResponse) }),
        },
      },
      description: "Prayer times bulk upserted",
    },
  },
});

prayerTimesAdminRoutes.openapi(bulkRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { entries } = c.req.valid("json");
  const result = await PrayerTimes.bulkUpsert(id, entries);
  return c.json({ data: result }, 201);
});
