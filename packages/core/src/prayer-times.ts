import type { PrayerTimeEntry } from "./domain.js";
import {
  getPrayerTimes,
  getTodayPrayerTimes,
  upsertPrayerTime,
  bulkUpsertPrayerTimes,
} from "./repository/drizzle.js";

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

export async function getForMosque(
  mosqueId: string,
  opts: GetOptions = {},
): Promise<PrayerTimeEntry[]> {
  return getPrayerTimes(mosqueId, opts);
}

export async function getToday(
  mosqueId: string,
): Promise<PrayerTimeEntry | undefined> {
  return getTodayPrayerTimes(mosqueId);
}

export async function upsert(
  mosqueId: string,
  data: UpsertData,
): Promise<PrayerTimeEntry> {
  return upsertPrayerTime(mosqueId, data);
}

export async function bulkUpsert(
  mosqueId: string,
  entries: UpsertData[],
): Promise<PrayerTimeEntry[]> {
  return bulkUpsertPrayerTimes(mosqueId, entries);
}
