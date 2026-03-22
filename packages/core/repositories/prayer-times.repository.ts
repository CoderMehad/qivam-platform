import { eq, and, gte, lte, sql, asc, count } from "drizzle-orm";
import { getDb } from "../adapters/neon.adapter.js";
import { mosques, prayerTimes } from "../schemas/drizzle.schema.js";
import type { PrayerTimeEntry } from "../models/prayer-times.model.js";
import type { PaginatedResult } from "../models/shared.model.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// ── Row Mapper ────────────────────────────────────────────────────────────────

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

// ── Queries ───────────────────────────────────────────────────────────────────

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
