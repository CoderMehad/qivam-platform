import { z } from "zod";

const timePattern = z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format");

export const createPrayerTimes = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  fajr: timePattern,
  dhuhr: timePattern,
  asr: timePattern,
  maghrib: timePattern,
  isha: timePattern,
  jummah: timePattern.nullable().optional(),
});

export const bulkSchema = z.object({
  entries: z.array(createPrayerTimes).min(1).max(31),
});

export const prayerTimesResponse = z.object({
  id: z.string().uuid(),
  mosqueId: z.string().uuid(),
  date: z.string(),
  fajr: z.string(),
  dhuhr: z.string(),
  asr: z.string(),
  maghrib: z.string(),
  isha: z.string(),
  jummah: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const querySchema = z.object({
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
