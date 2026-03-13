import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as PrayerTimes from "@openislam/core/prayer-times";
import type { AppEnv } from "../types.js";
import { apiKeyAuth } from "../middleware/api-key.js";
import { jwtAuth } from "../middleware/admin-auth.js";
import { requireOwnership } from "../middleware/ownership.js";
import { prayerTimesCache } from "../middleware/cache.js";
import {
  createPrayerTimes,
  bulkSchema,
  querySchema,
} from "../schemas/prayer-times.js";

export const prayerTimesRoutes = new Hono<AppEnv>();

// ── Public routes ───────────────────────────────────────────────────────────

prayerTimesRoutes.get(
  "/:id/prayer-times",
  apiKeyAuth,
  prayerTimesCache,
  zValidator("query", querySchema),
  async (c) => {
    const mosqueId = c.req.param("id");
    const query = c.req.valid("query");
    const entries = await PrayerTimes.getForMosque(mosqueId, query);
    return c.json({ data: entries });
  }
);

prayerTimesRoutes.get(
  "/:id/prayer-times/today",
  apiKeyAuth,
  prayerTimesCache,
  async (c) => {
    const mosqueId = c.req.param("id");
    const entry = await PrayerTimes.getToday(mosqueId);
    if (!entry) {
      return c.json({ error: "No prayer times found for today" }, 404);
    }
    return c.json(entry);
  }
);

// ── Admin routes ────────────────────────────────────────────────────────────

prayerTimesRoutes.post(
  "/:id/prayer-times",
  jwtAuth,
  requireOwnership(),
  zValidator("json", createPrayerTimes),
  async (c) => {
    const mosqueId = c.req.param("id");
    const data = c.req.valid("json");
    const entry = await PrayerTimes.upsert(mosqueId, data);
    return c.json(entry, 201);
  }
);

prayerTimesRoutes.post(
  "/:id/prayer-times/bulk",
  jwtAuth,
  requireOwnership(),
  zValidator("json", bulkSchema),
  async (c) => {
    const mosqueId = c.req.param("id");
    const { entries } = c.req.valid("json");
    const result = await PrayerTimes.bulkUpsert(mosqueId, entries);
    return c.json({ data: result }, 201);
  }
);
