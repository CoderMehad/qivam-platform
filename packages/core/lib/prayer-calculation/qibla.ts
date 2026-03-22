/**
 * Qibla direction and distance calculation.
 *
 * Uses the great-circle (spherical) formulae — accurate to ~0.1° for Qibla
 * bearing and ~0.5% for distance, which is more than sufficient.
 */

import type { Coordinates, QiblaResult } from "./types.js";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Ka'aba coordinates (Masjid al-Haram, Makkah). */
const KAABA: Coordinates = {
  latitude: 21.4225,
  longitude: 39.8262,
};

/** Mean radius of the Earth in kilometres. */
const EARTH_RADIUS_KM = 6371.009;

/**
 * Calculate the Qibla bearing and distance from a given location.
 *
 * @param from  Observer coordinates
 * @returns Bearing (0–360° from north) and distance in kilometres
 */
export function calculateQibla(from: Coordinates): QiblaResult {
  const lat1 = from.latitude * RAD;
  const lng1 = from.longitude * RAD;
  const lat2 = KAABA.latitude * RAD;
  const lng2 = KAABA.longitude * RAD;
  const dLng = lng2 - lng1;

  // Initial bearing (forward azimuth)
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = ((Math.atan2(y, x) * DEG) + 360) % 360;

  // Haversine distance
  const dLat = lat2 - lat1;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return {
    bearing: Math.round(bearing * 100) / 100,
    distance: Math.round(distance * 10) / 10,
  };
}
