/**
 * Prayer time calculation engine — type definitions.
 *
 * Pure data types with zero runtime dependencies.
 */

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Elevation in metres above sea level. Affects apparent sunrise/sunset. */
  elevation?: number;
}

// ---------------------------------------------------------------------------
// Calculation method
// ---------------------------------------------------------------------------

export type CalculationMethodId =
  | "mwl"
  | "isna"
  | "umm_al_qura"
  | "egyptian"
  | "karachi"
  | "tehran"
  | "jafari"
  | "gulf"
  | "kuwait"
  | "qatar"
  | "diyanet"
  | "jakim"
  | "muis"
  | "kemenag"
  | "tunisia"
  | "algeria"
  | "morocco"
  | "france"
  | "russia"
  | "dubai"
  | "jordan";

/** Isha can be angle-based or a fixed number of minutes after Maghrib. */
export type IshaCriterion =
  | { type: "angle"; degrees: number }
  | { type: "minutes"; minutes: number; ramadanMinutes?: number };

export interface CalculationMethodParams {
  id: CalculationMethodId;
  name: string;
  /** Sun angle below horizon for Fajr (degrees). */
  fajrAngle: number;
  /** Isha criterion — angle or fixed minutes. */
  isha: IshaCriterion;
  /** Sun angle below horizon for Maghrib. Default 0.833° (standard refraction). */
  maghribAngle?: number;
  /** Midnight mode: standard (sunset→sunrise midpoint) or jafari (sunset→fajr midpoint). */
  midnightMode?: "standard" | "jafari";
}

// ---------------------------------------------------------------------------
// Madhab & high latitude
// ---------------------------------------------------------------------------

/** Asr shadow ratio: standard (Shafi/Maliki/Hanbali) = 1×, hanafi = 2×. */
export type Madhab = "standard" | "hanafi";

export type HighLatitudeRule =
  | "middle_of_night"
  | "one_seventh"
  | "angle_based"
  | "none";

// ---------------------------------------------------------------------------
// Adjustments
// ---------------------------------------------------------------------------

/** Manual ±minute offsets applied after calculation. */
export interface PrayerAdjustments {
  fajr?: number;
  sunrise?: number;
  dhuhr?: number;
  asr?: number;
  maghrib?: number;
  isha?: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface CalculationConfig {
  /** A preset method ID or fully custom parameters. */
  method: CalculationMethodId | CalculationMethodParams;
  /** Defaults to "standard" (Shafi/Maliki/Hanbali). */
  madhab?: Madhab;
  /** Defaults to "middle_of_night". */
  highLatitudeRule?: HighLatitudeRule;
  /** Optional manual ±minute offsets per prayer. */
  adjustments?: PrayerAdjustments;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** All times as HH:MM strings in the mosque's local timezone. */
export interface CalculatedPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
}

// ---------------------------------------------------------------------------
// Qibla
// ---------------------------------------------------------------------------

export interface QiblaResult {
  /** Bearing in degrees from north (0–360). */
  bearing: number;
  /** Distance to the Ka'aba in kilometres. */
  distance: number;
}

// ---------------------------------------------------------------------------
// Solar (internal, but exported for testability)
// ---------------------------------------------------------------------------

export interface SolarPosition {
  /** Solar declination in degrees. */
  declination: number;
  /** Equation of time in minutes. */
  equationOfTime: number;
}
