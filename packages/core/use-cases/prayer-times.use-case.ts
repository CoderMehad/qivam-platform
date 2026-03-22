import type { PrayerTimeEntry } from "../models/prayer-times.model.js";
import type { PaginatedResult } from "../models/shared.model.js";
import {
  getPrayerTimes,
  getTodayPrayerTimes,
  upsertPrayerTime,
  bulkUpsertPrayerTimes,
} from "../repositories/prayer-times.repository.js";

export interface GetOptions {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
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
): Promise<PaginatedResult<PrayerTimeEntry>> {
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
