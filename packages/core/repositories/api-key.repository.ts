import { eq, and, desc, count } from "drizzle-orm";
import { getDb } from "../adapters/neon.adapter.js";
import { apiKeys } from "../schemas/drizzle.schema.js";
import type { ApiKey, ApiKeyPublic } from "../models/api-key.model.js";
import type { PaginatedResult } from "../models/shared.model.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// ── Row Mapper ────────────────────────────────────────────────────────────────

function mapApiKeyRow(row: typeof apiKeys.$inferSelect): ApiKey {
  return {
    id: row.id,
    prefix: row.prefix,
    keyHash: row.keyHash,
    name: row.name,
    contactEmail: row.contactEmail,
    rateLimit: row.rateLimit,
    isActive: row.isActive,
    analyticsEnabled: row.analyticsEnabled,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function insertApiKey(data: {
  prefix: string;
  keyHash: string;
  name: string;
  contactEmail: string;
}): Promise<ApiKey> {
  const db = getDb();
  const rows = await db
    .insert(apiKeys)
    .values({
      prefix: data.prefix,
      keyHash: data.keyHash,
      name: data.name,
      contactEmail: data.contactEmail,
    })
    .returning();

  if (!rows[0]) throw new Error("insertApiKey: no row returned after insert");
  return mapApiKeyRow(rows[0]);
}

export async function getApiKeyByPrefix(
  prefix: string,
): Promise<ApiKeyPublic | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.prefix, prefix))
    .limit(1);

  if (!rows[0]) return undefined;
  const mapped = mapApiKeyRow(rows[0]);
  const { keyHash: _, ...pub } = mapped;
  return pub;
}

export async function listAllApiKeys(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<ApiKeyPublic>> {
  const db = getDb();
  const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(apiKeys),
  ]);

  const total = Number(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map((row) => {
      const mapped = mapApiKeyRow(row);
      const { keyHash: _, ...pub } = mapped;
      return pub;
    }),
    page,
    limit,
    total,
    totalPages,
  };
}

export async function updateApiKeyActive(
  id: string,
  isActive: boolean,
): Promise<ApiKeyPublic | undefined> {
  const db = getDb();
  const rows = await db
    .update(apiKeys)
    .set({ isActive })
    .where(eq(apiKeys.id, id))
    .returning();

  if (!rows[0]) return undefined;
  const mapped = mapApiKeyRow(rows[0]);
  const { keyHash: _, ...pub } = mapped;
  return pub;
}

export async function getActiveApiKeyByHash(
  keyHash: string,
): Promise<{ id: string; name: string; rateLimit: number; analyticsEnabled: boolean } | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!rows[0]) return undefined;
  return { id: rows[0].id, name: rows[0].name, rateLimit: rows[0].rateLimit, analyticsEnabled: rows[0].analyticsEnabled };
}

export async function updateApiKeyAnalyticsEnabled(id: string, enabled: boolean): Promise<void> {
  const db = getDb();
  await db
    .update(apiKeys)
    .set({ analyticsEnabled: enabled })
    .where(eq(apiKeys.id, id));
}
