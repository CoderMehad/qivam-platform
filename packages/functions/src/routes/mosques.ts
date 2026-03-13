import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as Mosque from "@openislam/core/mosque";
import type { AppEnv } from "../types.js";
import { apiKeyAuth } from "../middleware/api-key.js";
import { jwtAuth } from "../middleware/admin-auth.js";
import { requireOwnership } from "../middleware/ownership.js";
import { publicCache } from "../middleware/cache.js";
import { uuidParam } from "../schemas/common.js";
import {
  createMosque,
  updateMosque,
  listQuery,
  nearbyQuery,
} from "../schemas/mosque.js";

export const mosqueRoutes = new Hono<AppEnv>();

// ── Public routes (API key required) ────────────────────────────────────────

mosqueRoutes.get(
  "/",
  apiKeyAuth,
  publicCache,
  zValidator("query", listQuery),
  async (c) => {
    const query = c.req.valid("query");
    const result = await Mosque.list(query);
    return c.json(result);
  }
);

mosqueRoutes.get(
  "/nearby",
  apiKeyAuth,
  publicCache,
  zValidator("query", nearbyQuery),
  async (c) => {
    const query = c.req.valid("query");
    const result = await Mosque.nearby({
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radius_km,
      limit: query.limit,
    });
    return c.json({ data: result });
  }
);

mosqueRoutes.get("/:id", apiKeyAuth, publicCache, async (c) => {
  const id = c.req.param("id");
  const mosque = await Mosque.getByIdOrSlug(id);
  if (!mosque) {
    return c.json({ error: "Mosque not found" }, 404);
  }
  return c.json(mosque);
});

// ── Admin routes (JWT + ownership) ──────────────────────────────────────────

mosqueRoutes.post(
  "/",
  jwtAuth,
  zValidator("json", createMosque),
  async (c) => {
    const data = c.req.valid("json");
    try {
      const mosque = await Mosque.create(data);
      return c.json(mosque, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      if (message.includes("already exists")) {
        return c.json({ error: message }, 409);
      }
      throw err;
    }
  }
);

mosqueRoutes.patch(
  "/:id",
  jwtAuth,
  requireOwnership(),
  zValidator("json", updateMosque),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const mosque = await Mosque.update(id, data);
    if (!mosque) {
      return c.json({ error: "Mosque not found" }, 404);
    }
    return c.json(mosque);
  }
);

mosqueRoutes.delete("/:id", jwtAuth, requireOwnership(), async (c) => {
  const id = c.req.param("id");
  try {
    const deleted = await Mosque.remove(id);
    if (!deleted) {
      return c.json({ error: "Mosque not found" }, 404);
    }
    return c.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return c.json({ error: message }, 409);
  }
});
