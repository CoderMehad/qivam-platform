import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as PrayerTimes from "@qivam/core/prayer-times";
import type { AppEnv } from "../types.js";
import { apiKeyAuth } from "../middleware/api-key.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { prayerTimesCache } from "../middleware/cache.js";
import {
  prayerTimesResponse,
  querySchema,
} from "../schemas/prayer-times.js";
import { errorResponse, paginationMeta } from "../schemas/common.js";

export const prayerTimesRoutes = new OpenAPIHono<AppEnv>();

// ── Public routes ───────────────────────────────────────────────────────────

const getRoute = createRoute({
  method: "get",
  path: "/{id}/prayer-times",
  middleware: [apiKeyAuth, rateLimiter, prayerTimesCache],
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: querySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(prayerTimesResponse) }).merge(paginationMeta),
        },
      },
      description: "Prayer times for mosque",
    },
  },
});

prayerTimesRoutes.openapi(getRoute, async (c) => {
  const { id } = c.req.valid("param");
  const query = c.req.valid("query");
  const result = await PrayerTimes.getForMosque(id, query);
  return c.json(result, 200);
});

const getTodayRoute = createRoute({
  method: "get",
  path: "/{id}/prayer-times/today",
  middleware: [apiKeyAuth, rateLimiter, prayerTimesCache],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: prayerTimesResponse } },
      description: "Today's prayer times",
    },
    404: {
      content: { "application/json": { schema: errorResponse } },
      description: "No prayer times for today",
    },
  },
});

prayerTimesRoutes.openapi(getTodayRoute, async (c) => {
  const { id } = c.req.valid("param");
  const entry = await PrayerTimes.getToday(id);
  if (!entry) {
    return c.json({ error: "No prayer times found for today" }, 404);
  }
  return c.json(entry, 200);
});
