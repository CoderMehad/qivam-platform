import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import {
  listAllApiKeys,
  updateApiKeyActive,
  updateApiKeyAnalyticsEnabled,
  listInvitations,
} from "@qivam/core/repository/drizzle";
import { superAdminAuth } from "../middleware/super-admin-auth.js";

export const superAdminRoutes = new Hono<AppEnv>();

superAdminRoutes.use("*", superAdminAuth);

// ── API Keys ────────────────────────────────────────────────────────────────

superAdminRoutes.get("/api-keys", async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const result = await listAllApiKeys({ page, limit });
  return c.json(result, 200);
});

superAdminRoutes.patch("/api-keys/:id/activate", async (c) => {
  const { id } = c.req.param();
  const key = await updateApiKeyActive(id, true);
  if (!key) return c.json({ error: "API key not found" }, 404);
  return c.json(key, 200);
});

superAdminRoutes.patch("/api-keys/:id/deactivate", async (c) => {
  const { id } = c.req.param();
  const key = await updateApiKeyActive(id, false);
  if (!key) return c.json({ error: "API key not found" }, 404);
  return c.json(key, 200);
});

superAdminRoutes.patch("/api-keys/:id/analytics-opt-in", async (c) => {
  const { id } = c.req.param();
  await updateApiKeyAnalyticsEnabled(id, true);
  return c.json({ ok: true }, 200);
});

superAdminRoutes.patch("/api-keys/:id/analytics-opt-out", async (c) => {
  const { id } = c.req.param();
  await updateApiKeyAnalyticsEnabled(id, false);
  return c.json({ ok: true }, 200);
});

// ── Invitations ─────────────────────────────────────────────────────────────

superAdminRoutes.get("/invitations", async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const result = await listInvitations({ page, limit });
  return c.json(result, 200);
});
