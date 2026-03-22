import { eq, and, or, sql, asc, count } from "drizzle-orm";
import { getDb } from "../adapters/neon.adapter.js";
import { mosques } from "../schemas/drizzle.schema.js";
import type { Mosque, MosqueFacility } from "../models/mosque.model.js";
import type { PaginatedResult } from "../models/shared.model.js";
import { slugify } from "../shared/helpers.js";
import { ConflictError } from "../errors.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// ── Row Mapper ────────────────────────────────────────────────────────────────

function mapMosqueRow(row: typeof mosques.$inferSelect): Mosque {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    phone: row.phone ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    lat: row.lat,
    lng: row.lng,
    timezone: row.timezone,
    facilities: JSON.parse(row.facilities) as MosqueFacility[],
    logoUrl: row.logoUrl ?? null,
    coverUrl: row.coverUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export interface ListMosquesParams {
  page?: number;
  limit?: number;
  city?: string;
}

export async function listMosques(
  params: ListMosquesParams = {},
): Promise<PaginatedResult<Mosque>> {
  const db = getDb();
  const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.city) {
    conditions.push(sql`lower(${mosques.city}) = lower(${params.city})`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(mosques)
      .where(whereClause)
      .orderBy(asc(mosques.createdAt), asc(mosques.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(mosques)
      .where(whereClause),
  ]);

  const total = Number(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map(mapMosqueRow),
    page,
    limit,
    total,
    totalPages,
  };
}

export async function getMosqueByIdOrSlug(
  idOrSlug: string,
): Promise<Mosque | undefined> {
  const db = getDb();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );
  const condition = isUuid
    ? or(eq(mosques.id, idOrSlug), eq(mosques.slug, idOrSlug))
    : eq(mosques.slug, idOrSlug);

  const rows = await db
    .select()
    .from(mosques)
    .where(condition)
    .limit(1);

  return rows[0] ? mapMosqueRow(rows[0]) : undefined;
}

export async function nearbyMosques(
  lat: number,
  lng: number,
  radiusKm: number,
  limit: number,
): Promise<Array<Mosque & { distance_km: number }>> {
  const db = getDb();
  const radiusMeters = radiusKm * 1000;

  const rows = await db.execute(sql`
    SELECT *,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${mosques.lng}, ${mosques.lat}), 4326)::geography
      ) / 1000.0 AS distance_km
    FROM mosques
    WHERE ST_DWithin(
      ST_SetSRID(ST_MakePoint(${mosques.lng}, ${mosques.lat}), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `);

  return (rows as unknown as Array<typeof mosques.$inferSelect & { distance_km: number }>).map((row) => ({
    ...mapMosqueRow(row),
    distance_km: Math.round(Number(row.distance_km) * 100) / 100,
  }));
}

export async function insertMosque(data: {
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  lat: number;
  lng: number;
  timezone?: string;
  facilities?: MosqueFacility[];
}): Promise<Mosque> {
  const db = getDb();
  try {
    const rows = await db
      .insert(mosques)
      .values({
        slug: slugify(data.name),
        name: data.name,
        address: data.address,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        lat: data.lat,
        lng: data.lng,
        timezone: data.timezone ?? "UTC",
        facilities: JSON.stringify(data.facilities ?? []),
      })
      .returning();

    return mapMosqueRow(rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("A mosque with this name (slug) already exists");
    }
    throw err;
  }
}

export async function updateMosque(
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    lat?: number;
    lng?: number;
    timezone?: string;
    facilities?: MosqueFacility[];
    logoUrl?: string | null;
    coverUrl?: string | null;
  },
): Promise<Mosque | undefined> {
  const db = getDb();

  const updates: Partial<typeof mosques.$inferInsert> = { updatedAt: new Date() };

  if (data.name !== undefined) {
    updates.name = data.name;
    updates.slug = slugify(data.name);
  }
  if (data.address !== undefined) updates.address = data.address;
  if (data.city !== undefined) updates.city = data.city;
  if (data.postcode !== undefined) updates.postcode = data.postcode;
  if (data.country !== undefined) updates.country = data.country;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.email !== undefined) updates.email = data.email;
  if (data.website !== undefined) updates.website = data.website;
  if (data.lat !== undefined) updates.lat = data.lat;
  if (data.lng !== undefined) updates.lng = data.lng;
  if (data.timezone !== undefined) updates.timezone = data.timezone;
  if (data.facilities !== undefined)
    updates.facilities = JSON.stringify(data.facilities);
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
  if (data.coverUrl !== undefined) updates.coverUrl = data.coverUrl;

  try {
    const rows = await db
      .update(mosques)
      .set(updates)
      .where(eq(mosques.id, id))
      .returning();

    return rows[0] ? mapMosqueRow(rows[0]) : undefined;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("A mosque with this name (slug) already exists");
    }
    throw err;
  }
}

export async function deleteMosque(id: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .delete(mosques)
    .where(eq(mosques.id, id))
    .returning({ id: mosques.id });

  return rows.length > 0;
}
