import { z } from "zod";

const datePattern = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");
const timePattern = z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format");

export const createPrayerTimes = z.object({
  date: datePattern,
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
  date: datePattern.optional(),
  from: datePattern.optional(),
  to: datePattern.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});
