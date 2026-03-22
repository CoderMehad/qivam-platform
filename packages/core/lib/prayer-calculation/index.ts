/**
 * Prayer time calculation engine — public API.
 *
 * Usage:
 *   import { calculatePrayerTimes, CALCULATION_METHODS } from "@qivam/core/lib/prayer-calculation";
 */

// Types
export type {
  Coordinates,
  CalculationMethodId,
  CalculationMethodParams,
  IshaCriterion,
  CalculationConfig,
  Madhab,
  HighLatitudeRule,
  PrayerAdjustments,
  CalculatedPrayerTimes,
  QiblaResult,
  SolarPosition,
} from "./types.js";

// Calculation methods
export { CALCULATION_METHODS, resolveMethod } from "./methods.js";

// Main engine
export { calculatePrayerTimes, calculateForRange } from "./prayer-times.js";

// Qibla
export { calculateQibla } from "./qibla.js";

// Solar (exposed for advanced usage / testing)
export {
  toJulianDate,
  solarPosition,
  hourAngle,
  sunTransit,
  asrHourAngle,
  elevationAngle,
} from "./solar.js";

// High latitude
export { nightPortions, adjustHighLatitude } from "./high-latitude.js";
