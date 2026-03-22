/**
 * Main prayer time calculation engine.
 *
 * Wires together solar position, high-latitude adjustments, and method
 * parameters to produce HH:MM local-time strings for all daily prayers.
 */

import type {
  Coordinates,
  CalculationConfig,
  CalculatedPrayerTimes,
  CalculationMethodParams,
  Madhab,
  HighLatitudeRule,
  PrayerAdjustments,
} from "./types.js";
import { resolveMethod } from "./methods.js";
import {
  toJulianDate,
  solarPosition,
  hourAngle,
  sunTransit,
  asrHourAngle,
  elevationAngle,
} from "./solar.js";
import { adjustHighLatitude } from "./high-latitude.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate prayer times for a single date.
 *
 * @param date  The date to calculate for
 * @param coordinates  Observer location
 * @param config  Calculation method, madhab, high-lat rule, adjustments
 * @param timezoneId  IANA timezone identifier (e.g. "Europe/London")
 * @returns All prayer times as HH:MM strings in local time
 */
export function calculatePrayerTimes(
  date: Date,
  coordinates: Coordinates,
  config: CalculationConfig,
  timezoneId: string,
): CalculatedPrayerTimes {
  const method = resolveMethod(config.method);
  const madhab: Madhab = config.madhab ?? "standard";
  const highLatRule: HighLatitudeRule = config.highLatitudeRule ?? "middle_of_night";
  const adjustments = config.adjustments ?? {};

  // Julian date for the given day at noon UT
  const jd = toJulianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const solar = solarPosition(jd);

  const { latitude, longitude, elevation } = coordinates;
  const elAngle = elevationAngle(elevation ?? 0);

  // Standard sun angle for sunrise/sunset (atmospheric refraction + sun semi-diameter)
  const sunAngle = 0.833 + elAngle;

  // Solar noon in UTC hours
  const transit = sunTransit(longitude, solar.equationOfTime);

  // Sunrise & sunset
  const sunHA = hourAngle(latitude, solar.declination, sunAngle);
  const sunriseUtc = transit - sunHA;
  const sunsetUtc = transit + sunHA;

  // Fajr
  const fajrHA = hourAngle(latitude, solar.declination, method.fajrAngle);
  let fajrUtc = transit - fajrHA;

  // Dhuhr (solar noon + 1 minute safety margin)
  const dhuhrUtc = transit;

  // Asr
  const shadowFactor = madhab === "hanafi" ? 2 : 1;
  const asrHA = asrHourAngle(latitude, solar.declination, shadowFactor);
  const asrUtc = transit + asrHA;

  // Maghrib
  const maghribAngle = method.maghribAngle ?? 0.833;
  let maghribUtc: number;
  if (maghribAngle === 0.833) {
    maghribUtc = sunsetUtc;
  } else {
    const mHA = hourAngle(latitude, solar.declination, maghribAngle + elAngle);
    maghribUtc = transit + mHA;
  }

  // Isha
  let ishaUtc: number;
  let ishaAngle: number;
  if (method.isha.type === "angle") {
    ishaAngle = method.isha.degrees;
    const ishaHA = hourAngle(latitude, solar.declination, ishaAngle);
    ishaUtc = transit + ishaHA;
  } else {
    ishaAngle = 0; // not angle-based; used for high-lat fallback denominator
    ishaUtc = maghribUtc + method.isha.minutes / 60;
  }

  // High-latitude adjustments (for angle-based prayers only)
  if (highLatRule !== "none") {
    const fajrIshaAngle = method.isha.type === "angle" ? method.isha.degrees : 18;
    const adjusted = adjustHighLatitude(
      fajrUtc,
      sunriseUtc,
      sunsetUtc,
      ishaUtc,
      highLatRule,
      method.fajrAngle,
      fajrIshaAngle,
    );
    fajrUtc = adjusted.fajr;
    if (method.isha.type === "angle") {
      ishaUtc = adjusted.isha;
    }
  }

  // Midnight
  const midnightUtc = computeMidnight(
    sunsetUtc,
    sunriseUtc,
    fajrUtc,
    method.midnightMode ?? "standard",
  );

  // Apply manual adjustments and convert to local HH:MM
  return {
    fajr: toLocalHHMM(fajrUtc + (adjustments.fajr ?? 0) / 60, date, timezoneId),
    sunrise: toLocalHHMM(sunriseUtc + (adjustments.sunrise ?? 0) / 60, date, timezoneId),
    dhuhr: toLocalHHMM(dhuhrUtc + (adjustments.dhuhr ?? 0) / 60, date, timezoneId),
    asr: toLocalHHMM(asrUtc + (adjustments.asr ?? 0) / 60, date, timezoneId),
    maghrib: toLocalHHMM(maghribUtc + (adjustments.maghrib ?? 0) / 60, date, timezoneId),
    isha: toLocalHHMM(ishaUtc + (adjustments.isha ?? 0) / 60, date, timezoneId),
    midnight: toLocalHHMM(midnightUtc, date, timezoneId),
  };
}

/**
 * Calculate prayer times for a range of dates (inclusive).
 *
 * @param startDate  First date
 * @param endDate  Last date (inclusive)
 * @param coordinates  Observer location
 * @param config  Calculation parameters
 * @param timezoneId  IANA timezone identifier
 * @returns Array of `{ date: "YYYY-MM-DD", times: CalculatedPrayerTimes }`
 */
export function calculateForRange(
  startDate: Date,
  endDate: Date,
  coordinates: Coordinates,
  config: CalculationConfig,
  timezoneId: string,
): Array<{ date: string; times: CalculatedPrayerTimes }> {
  const results: Array<{ date: string; times: CalculatedPrayerTimes }> = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = formatDateISO(current);
    const times = calculatePrayerTimes(current, coordinates, config, timezoneId);
    results.push({ date: dateStr, times });
    current.setDate(current.getDate() + 1);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute midnight.
 * Standard: midpoint between sunset and next sunrise.
 * Jafari: midpoint between sunset and next Fajr.
 */
function computeMidnight(
  sunsetUtc: number,
  sunriseUtc: number,
  fajrUtc: number,
  mode: "standard" | "jafari",
): number {
  if (mode === "jafari") {
    let diff = fajrUtc - sunsetUtc;
    if (diff < 0) diff += 24;
    return sunsetUtc + diff / 2;
  }
  let diff = sunriseUtc - sunsetUtc;
  if (diff < 0) diff += 24;
  return sunsetUtc + diff / 2;
}

/**
 * Convert UTC decimal hours to HH:MM in the given timezone.
 *
 * We construct a `Date` at the UTC instant, then use `Intl.DateTimeFormat`
 * with the target timezone to extract local hours and minutes.
 */
function toLocalHHMM(utcHours: number, date: Date, timezoneId: string): string {
  // Normalise to [0, 24)
  let h = utcHours % 24;
  if (h < 0) h += 24;

  // Build a UTC Date for this instant on the given calendar day
  const utcMs = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(h),
    Math.round((h - Math.floor(h)) * 60),
  );

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezoneId,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(new Date(utcMs));
}

/** Format a Date as YYYY-MM-DD. */
function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
