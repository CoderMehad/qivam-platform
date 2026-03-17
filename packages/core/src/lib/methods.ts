/**
 * 21 calculation method presets used by Islamic authorities worldwide.
 *
 * Each entry defines the Fajr angle, Isha criterion, and any non-standard
 * Maghrib angle or midnight mode. Everything else (Asr madhab, high-latitude
 * rule, manual adjustments) is configured separately.
 */

import type { CalculationMethodId, CalculationMethodParams } from "./types.js";

export const CALCULATION_METHODS: Record<CalculationMethodId, CalculationMethodParams> = {
  mwl: {
    id: "mwl",
    name: "Muslim World League",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 17 },
  },
  isna: {
    id: "isna",
    name: "Islamic Society of North America",
    fajrAngle: 15,
    isha: { type: "angle", degrees: 15 },
  },
  umm_al_qura: {
    id: "umm_al_qura",
    name: "Umm Al-Qura, Makkah",
    fajrAngle: 18.5,
    isha: { type: "minutes", minutes: 90, ramadanMinutes: 120 },
  },
  egyptian: {
    id: "egyptian",
    name: "Egyptian General Authority of Survey",
    fajrAngle: 19.5,
    isha: { type: "angle", degrees: 17.5 },
  },
  karachi: {
    id: "karachi",
    name: "University of Islamic Sciences, Karachi",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 18 },
  },
  tehran: {
    id: "tehran",
    name: "Institute of Geophysics, Tehran",
    fajrAngle: 17.7,
    isha: { type: "angle", degrees: 14 },
    maghribAngle: 4.5,
  },
  jafari: {
    id: "jafari",
    name: "Shia Ithna-Ashari, Leva Institute, Qum",
    fajrAngle: 16,
    isha: { type: "angle", degrees: 14 },
    maghribAngle: 4,
    midnightMode: "jafari",
  },
  gulf: {
    id: "gulf",
    name: "Gulf Region",
    fajrAngle: 19.5,
    isha: { type: "minutes", minutes: 90 },
  },
  kuwait: {
    id: "kuwait",
    name: "Kuwait",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 17.5 },
  },
  qatar: {
    id: "qatar",
    name: "Qatar",
    fajrAngle: 18.5,
    isha: { type: "minutes", minutes: 90 },
  },
  diyanet: {
    id: "diyanet",
    name: "Diyanet İşleri Başkanlığı, Turkey",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 17 },
  },
  jakim: {
    id: "jakim",
    name: "Jabatan Kemajuan Islam Malaysia",
    fajrAngle: 20,
    isha: { type: "angle", degrees: 18 },
  },
  muis: {
    id: "muis",
    name: "Majlis Ugama Islam Singapura",
    fajrAngle: 20,
    isha: { type: "angle", degrees: 18 },
  },
  kemenag: {
    id: "kemenag",
    name: "Kementerian Agama RI, Indonesia",
    fajrAngle: 20,
    isha: { type: "angle", degrees: 18 },
  },
  tunisia: {
    id: "tunisia",
    name: "Ministry of Religious Affairs, Tunisia",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 18 },
  },
  algeria: {
    id: "algeria",
    name: "Ministry of Religious Affairs, Algeria",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 17 },
  },
  morocco: {
    id: "morocco",
    name: "Ministry of Habous and Islamic Affairs, Morocco",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 17 },
  },
  france: {
    id: "france",
    name: "Union of Islamic Organisations of France",
    fajrAngle: 12,
    isha: { type: "angle", degrees: 12 },
  },
  russia: {
    id: "russia",
    name: "Spiritual Administration of Muslims, Russia",
    fajrAngle: 16,
    isha: { type: "angle", degrees: 15 },
  },
  dubai: {
    id: "dubai",
    name: "Dubai",
    fajrAngle: 18.2,
    isha: { type: "angle", degrees: 18.2 },
  },
  jordan: {
    id: "jordan",
    name: "Ministry of Awqaf and Islamic Affairs, Jordan",
    fajrAngle: 18,
    isha: { type: "angle", degrees: 18 },
  },
};

/**
 * Resolve a method ID or custom params into a full `CalculationMethodParams`.
 * Throws if an unknown ID is supplied.
 */
export function resolveMethod(
  method: CalculationMethodId | CalculationMethodParams,
): CalculationMethodParams {
  if (typeof method === "string") {
    const params = CALCULATION_METHODS[method];
    if (!params) {
      throw new Error(`Unknown calculation method: ${method}`);
    }
    return params;
  }
  return method;
}
