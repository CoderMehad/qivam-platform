import { z } from "zod";

const datePattern = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const calculationMethodIds = [
  "mwl", "isna", "umm_al_qura", "egyptian", "karachi",
  "tehran", "jafari", "gulf", "kuwait", "qatar", "diyanet",
  "jakim", "muis", "kemenag", "tunisia", "algeria", "morocco",
  "france", "russia", "dubai", "jordan",
] as const;

const methodEnum = z.enum(calculationMethodIds);

const madhabEnum = z.enum(["standard", "hanafi"]).optional().default("standard");

const highLatEnum = z.enum(["middle_of_night", "one_seventh", "angle_based", "none"])
  .optional()
  .default("middle_of_night");

/**
 * Query params for mosque-based calculation (lat/lng/timezone come from the mosque).
 */
export const mosqueCalculateQuery = z.object({
  date: datePattern,
  method: methodEnum,
  madhab: madhabEnum,
  high_latitude_rule: highLatEnum,
  fajr_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  sunrise_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  dhuhr_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  asr_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  maghrib_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  isha_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
});

/**
 * Query params for standalone calculation (caller provides coordinates).
 */
export const standaloneCalculateQuery = mosqueCalculateQuery.extend({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  elevation: z.coerce.number().min(0).max(10000).optional(),
  timezone: z.string().min(1),
});

/**
 * Body for admin generate endpoint — calculate + store for a date range.
 */
export const generateBody = z.object({
  from: datePattern,
  to: datePattern,
  method: methodEnum,
  madhab: madhabEnum,
  high_latitude_rule: highLatEnum,
  fajr_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  sunrise_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  dhuhr_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  asr_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  maghrib_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
  isha_adjustment: z.coerce.number().int().min(-30).max(30).optional(),
});

/**
 * Response schema for calculated prayer times.
 */
export const calculatedTimesResponse = z.object({
  date: z.string(),
  fajr: z.string(),
  sunrise: z.string(),
  dhuhr: z.string(),
  asr: z.string(),
  maghrib: z.string(),
  isha: z.string(),
  midnight: z.string(),
  method: z.string(),
  madhab: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  timezone: z.string(),
});

/**
 * Response schema for qibla.
 */
export const qiblaResponse = z.object({
  bearing: z.number(),
  distance: z.number(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});
