/**
 * High-latitude adjustment strategies.
 *
 * At latitudes above ~48° the sun may not dip below the Fajr/Isha angle
 * during parts of the year (perpetual twilight). These strategies provide
 * reasonable approximations.
 */

import type { HighLatitudeRule } from "./types.js";

export interface NightPortion {
  fajrPortion: number;
  ishaPortion: number;
}

/**
 * Compute the fraction of the night assigned to Fajr and Isha under the
 * given high-latitude rule.
 *
 * @param rule  The strategy to apply
 * @param fajrAngle  Fajr depression angle in degrees
 * @param ishaAngle  Isha depression angle in degrees (ignored for fixed-minute methods)
 */
export function nightPortions(
  rule: HighLatitudeRule,
  fajrAngle: number,
  ishaAngle: number,
): NightPortion {
  switch (rule) {
    case "middle_of_night":
      return { fajrPortion: 0.5, ishaPortion: 0.5 };

    case "one_seventh":
      return { fajrPortion: 1 / 7, ishaPortion: 1 / 7 };

    case "angle_based":
      return {
        fajrPortion: fajrAngle / 60,
        ishaPortion: ishaAngle / 60,
      };

    case "none":
      return { fajrPortion: 0, ishaPortion: 0 };
  }
}

/**
 * Adjust Fajr and Isha times that are `NaN` (sun never reaches the required
 * angle) using the chosen high-latitude strategy.
 *
 * @param fajrUtc  Calculated Fajr in UTC decimal hours (may be NaN)
 * @param sunriseUtc  Sunrise in UTC decimal hours
 * @param sunsetUtc  Sunset in UTC decimal hours
 * @param ishaUtc  Calculated Isha in UTC decimal hours (may be NaN)
 * @param rule  High-latitude rule
 * @param fajrAngle  Fajr depression angle
 * @param ishaAngle  Isha depression angle
 * @returns Adjusted `{ fajr, isha }` in UTC decimal hours
 */
export function adjustHighLatitude(
  fajrUtc: number,
  sunriseUtc: number,
  sunsetUtc: number,
  ishaUtc: number,
  rule: HighLatitudeRule,
  fajrAngle: number,
  ishaAngle: number,
): { fajr: number; isha: number } {
  if (rule === "none") {
    return { fajr: fajrUtc, isha: ishaUtc };
  }

  const nightDuration = nightLength(sunsetUtc, sunriseUtc);
  const { fajrPortion, ishaPortion } = nightPortions(rule, fajrAngle, ishaAngle);

  let fajr = fajrUtc;
  let isha = ishaUtc;

  // Adjust Fajr if invalid or extends beyond its night portion
  const fajrLimit = sunriseUtc - fajrPortion * nightDuration;
  if (isNaN(fajr) || fajr < fajrLimit) {
    fajr = fajrLimit;
  }

  // Adjust Isha if invalid or extends beyond its night portion
  const ishaLimit = sunsetUtc + ishaPortion * nightDuration;
  if (isNaN(isha) || isha > ishaLimit) {
    isha = ishaLimit;
  }

  return { fajr, isha };
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

/** Duration of the night in hours (handles overnight wrap-around). */
function nightLength(sunsetUtc: number, sunriseUtc: number): number {
  let night = sunriseUtc - sunsetUtc;
  if (night < 0) night += 24;
  return night;
}
