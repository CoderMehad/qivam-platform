import { eq, and, or, gte, lte, sql, asc, desc, count } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import {
  mosques,
  admins,
  prayerTimes,
  apiKeys,
  invitations,
} from "../db/schema.js";
import type { Mosque, Admin, PrayerTimeEntry, ApiKey, ApiKeyPublic, Invitation, MosqueFacility } from "../domain.js";
import type { PaginatedResult } from "../domain.js";
import { slugify } from "./helpers.js";
import { ConflictError } from "../errors.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// ── Row Mappers ──────────────────────────────────────────────────────────────

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

function mapAdminRow(row: typeof admins.$inferSelect): Admin {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    mosqueId: row.mosqueId,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrayerTimeRow(row: typeof prayerTimes.$inferSelect): PrayerTimeEntry {
  return {
    id: row.id,
    mosqueId: row.mosqueId,
    date: row.date,
    fajr: row.fajr,
    dhuhr: row.dhuhr,
    asr: row.asr,
    maghrib: row.maghrib,
    isha: row.isha,
    jummah: row.jummah ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapApiKeyRow(row: typeof apiKeys.$inferSelect): ApiKey {
  return {
    id: row.id,
    prefix: row.prefix,
    keyHash: row.keyHash,
    name: row.name,
    contactEmail: row.contactEmail,
    rateLimit: row.rateLimit,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Mosque Repository ────────────────────────────────────────────────────────

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

// ── Admin Repository ─────────────────────────────────────────────────────────

export async function getAdminByEmail(
  email: string,
): Promise<Admin | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  return rows[0] ? mapAdminRow(rows[0]) : undefined;
}

export async function insertAdmin(data: {
  email: string;
  name: string;
  passwordHash: string;
  mosqueId: string;
}): Promise<Admin> {
  const db = getDb();
  const rows = await db
    .insert(admins)
    .values({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      mosqueId: data.mosqueId,
    })
    .returning();

  return mapAdminRow(rows[0]);
}

// ── Prayer Times Repository ─────────────────────────────────────────────────

export interface GetPrayerTimesOpts {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getPrayerTimes(
  mosqueId: string,
  opts: GetPrayerTimesOpts = {},
): Promise<PaginatedResult<PrayerTimeEntry>> {
  const db = getDb();
  const limit = Math.min(opts.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(opts.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const conditions = [eq(prayerTimes.mosqueId, mosqueId)];

  if (opts.date) {
    conditions.push(eq(prayerTimes.date, opts.date));
  }
  if (opts.from) {
    conditions.push(gte(prayerTimes.date, opts.from));
  }
  if (opts.to) {
    conditions.push(lte(prayerTimes.date, opts.to));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(prayerTimes)
      .where(whereClause)
      .orderBy(asc(prayerTimes.date))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(prayerTimes)
      .where(whereClause),
  ]);

  const total = Number(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map(mapPrayerTimeRow),
    page,
    limit,
    total,
    totalPages,
  };
}

export async function getTodayPrayerTimes(
  mosqueId: string,
): Promise<PrayerTimeEntry | undefined> {
  const db = getDb();

  // Look up mosque timezone to compute the correct local date
  const mosqueRows = await db
    .select({ timezone: mosques.timezone })
    .from(mosques)
    .where(eq(mosques.id, mosqueId))
    .limit(1);

  const tz = mosqueRows[0]?.timezone ?? "UTC";
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const rows = await db
    .select()
    .from(prayerTimes)
    .where(
      and(eq(prayerTimes.mosqueId, mosqueId), eq(prayerTimes.date, todayStr)),
    )
    .limit(1);

  return rows[0] ? mapPrayerTimeRow(rows[0]) : undefined;
}

export async function upsertPrayerTime(
  mosqueId: string,
  data: {
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah?: string | null;
  },
): Promise<PrayerTimeEntry> {
  const db = getDb();
  const now = new Date();

  const rows = await db
    .insert(prayerTimes)
    .values({
      mosqueId,
      date: data.date,
      fajr: data.fajr,
      dhuhr: data.dhuhr,
      asr: data.asr,
      maghrib: data.maghrib,
      isha: data.isha,
      jummah: data.jummah ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [prayerTimes.mosqueId, prayerTimes.date],
      set: {
        fajr: data.fajr,
        dhuhr: data.dhuhr,
        asr: data.asr,
        maghrib: data.maghrib,
        isha: data.isha,
        jummah: data.jummah ?? null,
        updatedAt: now,
      },
    })
    .returning();

  return mapPrayerTimeRow(rows[0]);
}

export async function bulkUpsertPrayerTimes(
  mosqueId: string,
  entries: Array<{
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah?: string | null;
  }>,
): Promise<PrayerTimeEntry[]> {
  const db = getDb();
  const now = new Date();

  const values = entries.map((data) => ({
    mosqueId,
    date: data.date,
    fajr: data.fajr,
    dhuhr: data.dhuhr,
    asr: data.asr,
    maghrib: data.maghrib,
    isha: data.isha,
    jummah: data.jummah ?? null,
    createdAt: now,
    updatedAt: now,
  }));

  const rows = await db
    .insert(prayerTimes)
    .values(values)
    .onConflictDoUpdate({
      target: [prayerTimes.mosqueId, prayerTimes.date],
      set: {
        fajr: sql`excluded.fajr`,
        dhuhr: sql`excluded.dhuhr`,
        asr: sql`excluded.asr`,
        maghrib: sql`excluded.maghrib`,
        isha: sql`excluded.isha`,
        jummah: sql`excluded.jummah`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning();

  return rows.map(mapPrayerTimeRow);
}

// ── API Key Repository ──────────────────────────────────────────────────────

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

// ── Invitation Repository ────────────────────────────────────────────────────

function mapInvitationRow(row: typeof invitations.$inferSelect): Invitation {
  return {
    id: row.id,
    email: row.email,
    mosqueId: row.mosqueId,
    invitedBy: row.invitedBy,
    token: row.token,
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function insertInvitation(data: {
  email: string;
  mosqueId: string;
  invitedBy: string;
  token: string;
  expiresAt: Date;
}): Promise<Invitation> {
  const db = getDb();
  const rows = await db
    .insert(invitations)
    .values({
      email: data.email,
      mosqueId: data.mosqueId,
      invitedBy: data.invitedBy,
      token: data.token,
      expiresAt: data.expiresAt,
    })
    .returning();

  return mapInvitationRow(rows[0]);
}

export async function getInvitationByToken(
  token: string,
): Promise<Invitation | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  return rows[0] ? mapInvitationRow(rows[0]) : undefined;
}

export async function markInvitationUsed(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.id, id));
}

// ── API Key Repository ──────────────────────────────────────────────────────

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

export async function listInvitations(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<Invitation>> {
  const db = getDb();
  const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(invitations)
      .orderBy(desc(invitations.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(invitations),
  ]);

  const total = Number(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map(mapInvitationRow),
    page,
    limit,
    total,
    totalPages,
  };
}

export async function getActiveApiKeyByHash(
  keyHash: string,
): Promise<{ id: string; name: string; rateLimit: number } | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!rows[0]) return undefined;
  return { id: rows[0].id, name: rows[0].name, rateLimit: rows[0].rateLimit };
}
