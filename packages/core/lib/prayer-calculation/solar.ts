/**
 * Solar position algorithms based on Jean Meeus' "Astronomical Algorithms".
 *
 * Simplified to ~1 arcminute accuracy — more than sufficient for prayer times
 * where the rounding granularity is whole minutes.
 *
 * All angles in this module are in DEGREES unless suffixed with `Rad`.
 */

import type { SolarPosition } from "./types.js";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// ---------------------------------------------------------------------------
// Julian Day Number
// ---------------------------------------------------------------------------

/**
 * Convert a Gregorian date (year, 1-based month, fractional day) to a
 * Julian Day Number using the algorithm from Meeus ch. 7.
 */
export function toJulianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  );
}

// ---------------------------------------------------------------------------
// Solar position
// ---------------------------------------------------------------------------

/**
 * Compute the sun's declination and equation of time for a given Julian Day.
 *
 * Uses the "low-accuracy" formulae from Meeus chapters 25 & 28, which give
 * results accurate to roughly 0.01° — plenty for prayer time calculation.
 */
export function solarPosition(jd: number): SolarPosition {
  // Julian centuries since J2000.0
  const T = (jd - 2451545.0) / 36525.0;

  // Geometric mean longitude of the sun (degrees)
  const L0 = normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T);

  // Mean anomaly of the sun (degrees)
  const M = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const MRad = M * RAD;

  // Equation of the center (degrees)
  const C =
    (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(MRad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * MRad) +
    0.00029 * Math.sin(3 * MRad);

  // Sun's true longitude (degrees)
  const sunLng = L0 + C;

  // Apparent longitude (correct for nutation & aberration, simplified)
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunLng - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  // Obliquity of the ecliptic (degrees)
  const epsilon0 =
    23 + (26 + (21.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T) / 60) / 60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(omega * RAD);

  // Solar declination (degrees)
  const declination =
    Math.asin(Math.sin(epsilon * RAD) * Math.sin(lambda * RAD)) * DEG;

  // Equation of time (minutes)
  const y = Math.tan((epsilon / 2) * RAD) ** 2;
  const L0Rad = L0 * RAD;
  const eqt =
    4 *
    DEG *
    (y * Math.sin(2 * L0Rad) -
      2 * 0.016709 * Math.sin(MRad) +
      4 * 0.016709 * y * Math.sin(MRad) * Math.cos(2 * L0Rad) -
      0.5 * y * y * Math.sin(4 * L0Rad) -
      1.25 * 0.016709 * 0.016709 * Math.sin(2 * MRad));

  return { declination, equationOfTime: eqt };
}

// ---------------------------------------------------------------------------
// Hour angle
// ---------------------------------------------------------------------------

/**
 * Calculate the hour angle (in hours) for the sun at a given angle below
 * the horizon. Returns `NaN` if the sun never reaches that angle (polar
 * latitudes / extreme angles).
 *
 * @param latitude  Observer latitude in degrees
 * @param declination  Solar declination in degrees
 * @param angle  Angle below horizon in degrees (positive = below)
 */
export function hourAngle(
  latitude: number,
  declination: number,
  angle: number,
): number {
  const latRad = latitude * RAD;
  const decRad = declination * RAD;

  const cosH =
    (-Math.sin(angle * RAD) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  if (cosH > 1 || cosH < -1) return NaN;

  return (Math.acos(cosH) * DEG) / 15; // convert degrees to hours
}

// ---------------------------------------------------------------------------
// Solar noon / transit
// ---------------------------------------------------------------------------

/**
 * Solar noon (transit) in UTC decimal hours.
 *
 * @param longitude  Observer longitude in degrees (east positive)
 * @param equationOfTime  Equation of time in minutes
 */
export function sunTransit(longitude: number, equationOfTime: number): number {
  return 12 - equationOfTime / 60 - longitude / 15;
}

// ---------------------------------------------------------------------------
// Asr
// ---------------------------------------------------------------------------

/**
 * Hour angle for Asr prayer.
 *
 * The Asr time is when the shadow of an object equals its length times
 * `shadowFactor` plus the shadow at noon.
 *
 * @param latitude  Observer latitude in degrees
 * @param declination  Solar declination in degrees
 * @param shadowFactor  1 for standard (Shafi'i), 2 for Hanafi
 */
export function asrHourAngle(
  latitude: number,
  declination: number,
  shadowFactor: number,
): number {
  const latRad = latitude * RAD;
  const decRad = declination * RAD;

  const acotArg = shadowFactor + Math.tan(Math.abs(latRad - decRad));
  const altitude = Math.atan(1 / acotArg);

  const cosH =
    (Math.sin(altitude) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  if (cosH > 1 || cosH < -1) return NaN;

  return (Math.acos(cosH) * DEG) / 15;
}

// ---------------------------------------------------------------------------
// Elevation adjustment
// ---------------------------------------------------------------------------

/**
 * Adjustment to the standard solar depression angle for observer elevation.
 * Higher elevation means the sun is visible slightly longer.
 *
 * Returns degrees to ADD to the sunrise/sunset angle (0.833°).
 */
export function elevationAngle(elevation: number): number {
  if (elevation <= 0) return 0;
  return 0.0347 * Math.sqrt(elevation);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize an angle to [0, 360). */
function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
