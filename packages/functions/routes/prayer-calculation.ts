import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as Mosque from "@qivam/core/mosque";
import {
  calculatePrayerTimes,
  calculateForRange,
  calculateQibla,
  resolveMethod,
} from "@qivam/core/lib/prayer-calculation";
import type {
  CalculationConfig,
  PrayerAdjustments,
  Coordinates,
} from "@qivam/core/lib/prayer-calculation";
import type { AppEnv } from "../types.js";
import { apiKeyAuth } from "../middleware/api-key.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { publicCache } from "../middleware/cache.js";
import { errorResponse } from "@qivam/core/schemas/common";
import {
  mosqueCalculateQuery,
  standaloneCalculateQuery,
  calculatedTimesResponse,
  qiblaResponse,
} from "@qivam/core/schemas/prayer-calculation";

export const prayerCalculationRoutes = new OpenAPIHono<AppEnv>();
export const standalonePrayerCalculationRoutes = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RawParams {
  method: string;
  madhab?: string;
  high_latitude_rule?: string;
  fajr_adjustment?: number;
  sunrise_adjustment?: number;
  dhuhr_adjustment?: number;
  asr_adjustment?: number;
  maghrib_adjustment?: number;
  isha_adjustment?: number;
}

function buildConfig(params: RawParams): CalculationConfig {
  const adjustments: PrayerAdjustments = {};
  if (params.fajr_adjustment) adjustments.fajr = params.fajr_adjustment;
  if (params.sunrise_adjustment) adjustments.sunrise = params.sunrise_adjustment;
  if (params.dhuhr_adjustment) adjustments.dhuhr = params.dhuhr_adjustment;
  if (params.asr_adjustment) adjustments.asr = params.asr_adjustment;
  if (params.maghrib_adjustment) adjustments.maghrib = params.maghrib_adjustment;
  if (params.isha_adjustment) adjustments.isha = params.isha_adjustment;

  return {
    method: params.method as CalculationConfig["method"],
    madhab: (params.madhab ?? "standard") as CalculationConfig["madhab"],
    highLatitudeRule: (params.high_latitude_rule ?? "middle_of_night") as CalculationConfig["highLatitudeRule"],
    adjustments: Object.keys(adjustments).length > 0 ? adjustments : undefined,
  };
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ---------------------------------------------------------------------------
// GET /mosques/{id}/prayer-times/calculate
// ---------------------------------------------------------------------------

const mosqueCalculateRoute = createRoute({
  method: "get",
  path: "/{id}/prayer-times/calculate",
  middleware: [apiKeyAuth, rateLimiter, publicCache],
  request: {
    params: z.object({ id: z.string() }),
    query: mosqueCalculateQuery,
  },
  responses: {
    200: {
      content: { "application/json": { schema: calculatedTimesResponse } },
      description: "Calculated prayer times for the mosque",
    },
    404: {
      content: { "application/json": { schema: errorResponse } },
      description: "Mosque not found",
    },
  },
});

prayerCalculationRoutes.openapi(mosqueCalculateRoute, async (c) => {
  const { id } = c.req.valid("param");
  const query = c.req.valid("query");

  const mosque = await Mosque.getByIdOrSlug(id);
  if (!mosque) {
    return c.json({ error: "Mosque not found" }, 404);
  }

  const config = buildConfig(query);
  const coords: Coordinates = { latitude: mosque.lat, longitude: mosque.lng };
  const date = parseDate(query.date);

  const times = calculatePrayerTimes(date, coords, config, mosque.timezone);
  const method = resolveMethod(config.method as CalculationConfig["method"]);

  return c.json({
    date: query.date,
    ...times,
    method: method.name,
    madhab: query.madhab ?? "standard",
    coordinates: { latitude: mosque.lat, longitude: mosque.lng },
    timezone: mosque.timezone,
  }, 200);
});

// ---------------------------------------------------------------------------
// GET /mosques/{id}/qibla
// ---------------------------------------------------------------------------

const qiblaRoute = createRoute({
  method: "get",
  path: "/{id}/qibla",
  middleware: [apiKeyAuth, rateLimiter, publicCache],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: qiblaResponse } },
      description: "Qibla direction from mosque",
    },
    404: {
      content: { "application/json": { schema: errorResponse } },
      description: "Mosque not found",
    },
  },
});

prayerCalculationRoutes.openapi(qiblaRoute, async (c) => {
  const { id } = c.req.valid("param");

  const mosque = await Mosque.getByIdOrSlug(id);
  if (!mosque) {
    return c.json({ error: "Mosque not found" }, 404);
  }

  const result = calculateQibla({ latitude: mosque.lat, longitude: mosque.lng });

  return c.json({
    ...result,
    coordinates: { latitude: mosque.lat, longitude: mosque.lng },
  }, 200);
});

// ---------------------------------------------------------------------------
// GET /v1/prayer-times/calculate (standalone — no mosque required)
// ---------------------------------------------------------------------------

const standaloneCalculateRoute = createRoute({
  method: "get",
  path: "/calculate",
  middleware: [apiKeyAuth, rateLimiter, publicCache],
  request: {
    query: standaloneCalculateQuery,
  },
  responses: {
    200: {
      content: { "application/json": { schema: calculatedTimesResponse } },
      description: "Calculated prayer times for given coordinates",
    },
  },
});

standalonePrayerCalculationRoutes.openapi(standaloneCalculateRoute, async (c) => {
  const query = c.req.valid("query");

  const config = buildConfig(query);
  const coords: Coordinates = {
    latitude: query.latitude,
    longitude: query.longitude,
    elevation: query.elevation,
  };
  const date = parseDate(query.date);

  const times = calculatePrayerTimes(date, coords, config, query.timezone);
  const method = resolveMethod(config.method as CalculationConfig["method"]);

  return c.json({
    date: query.date,
    ...times,
    method: method.name,
    madhab: query.madhab ?? "standard",
    coordinates: { latitude: query.latitude, longitude: query.longitude },
    timezone: query.timezone,
  }, 200);
});
