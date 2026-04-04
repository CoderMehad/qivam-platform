import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
let tzlookup: (lat: number, lon: number) => string;
try {
  const _tz = _require("tzlookup");
  if (typeof _tz === "function") tzlookup = _tz;
  else if (typeof _tz?.tzNameAt === "function") tzlookup = _tz.tzNameAt;
  else if (typeof _tz?.default === "function") tzlookup = _tz.default;
  else tzlookup = () => "UTC";
} catch {
  tzlookup = () => "UTC";
}

// ── ID & Timestamp ───────────────────────────────────────────────────────────

export function generateId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── String ───────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Geo ──────────────────────────────────────────────────────────────────────

/** Haversine distance in km */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Infer IANA timezone from coordinates. Falls back to "UTC" if lookup fails. */
export function inferTimezone(lat: number, lng: number): string {
  try {
    return tzlookup(lat, lng) ?? "UTC";
  } catch {
    return "UTC";
  }
}

// ── Crypto ───────────────────────────────────────────────────────────────────

/** SHA-256 hash for API key storage */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
