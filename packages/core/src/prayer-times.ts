import type { PrayerTimeEntry } from "./domain.js";
import { prayerTimes, generateId, now, today } from "./repository/mock.js";

export interface GetOptions {
  date?: string;
  from?: string;
  to?: string;
}

export interface UpsertData {
  date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah?: string | null;
}

export function getForMosque(
  mosqueId: string,
  opts: GetOptions = {}
): PrayerTimeEntry[] {
  let entries = Array.from(prayerTimes.values())
    .filter((pt) => pt.mosqueId === mosqueId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (opts.date) {
    entries = entries.filter((pt) => pt.date === opts.date);
  }
  if (opts.from) {
    entries = entries.filter((pt) => pt.date >= opts.from!);
  }
  if (opts.to) {
    entries = entries.filter((pt) => pt.date <= opts.to!);
  }

  return entries;
}

export function getToday(mosqueId: string): PrayerTimeEntry | undefined {
  const todayStr = today();
  return Array.from(prayerTimes.values()).find(
    (pt) => pt.mosqueId === mosqueId && pt.date === todayStr
  );
}

export function upsert(
  mosqueId: string,
  data: UpsertData
): PrayerTimeEntry {
  const existing = Array.from(prayerTimes.values()).find(
    (pt) => pt.mosqueId === mosqueId && pt.date === data.date
  );

  if (existing) {
    const updated: PrayerTimeEntry = {
      ...existing,
      ...data,
      jummah: data.jummah ?? existing.jummah,
      updatedAt: now(),
    };
    prayerTimes.set(existing.id, updated);
    return updated;
  }

  const id = generateId();
  const timestamp = now();
  const entry: PrayerTimeEntry = {
    id,
    mosqueId,
    date: data.date,
    fajr: data.fajr,
    dhuhr: data.dhuhr,
    asr: data.asr,
    maghrib: data.maghrib,
    isha: data.isha,
    jummah: data.jummah ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  prayerTimes.set(id, entry);
  return entry;
}

export function bulkUpsert(
  mosqueId: string,
  entries: UpsertData[]
): PrayerTimeEntry[] {
  return entries.map((entry) => upsert(mosqueId, entry));
}
