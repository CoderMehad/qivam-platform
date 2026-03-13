import type { Mosque, Admin, PrayerTimeEntry, ApiKey } from "../domain.js";
import { createHash } from "node:crypto";

// ── Stores ──────────────────────────────────────────────────────────────────

export const mosques = new Map<string, Mosque>();
export const admins = new Map<string, Admin>();
export const prayerTimes = new Map<string, PrayerTimeEntry>();
export const apiKeys = new Map<string, ApiKey>();

// ── Helpers ─────────────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
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

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Haversine distance in km */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
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

/** Base64-encode a cursor from createdAt + id */
export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString("base64url");
}

/** Decode a cursor back to { createdAt, id } */
export function decodeCursor(
  cursor: string
): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString();
    const [createdAt, id] = decoded.split("|");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/** SHA-256 hash for API key storage */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ── Seed Data ───────────────────────────────────────────────────────────────

const SEED_MOSQUES: Mosque[] = [
  {
    id: "m1000000-0000-0000-0000-000000000001",
    slug: "east-london-mosque",
    name: "East London Mosque",
    address: "82-92 Whitechapel Rd",
    city: "London",
    postcode: "E1 1JQ",
    country: "GB",
    phone: "+442076507000",
    email: "info@eastlondonmosque.org.uk",
    website: "https://www.eastlondonmosque.org.uk",
    lat: 51.5194,
    lng: -0.0653,
    facilities: ["parking", "wheelchair_access", "womens_area", "wudu_area", "islamic_school", "library", "community_hall"],
    logoUrl: null,
    coverUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "m2000000-0000-0000-0000-000000000002",
    slug: "london-central-mosque",
    name: "London Central Mosque",
    address: "146 Park Rd",
    city: "London",
    postcode: "NW8 7RG",
    country: "GB",
    phone: "+442077243363",
    email: null,
    website: "https://www.iccuk.org",
    lat: 51.5276,
    lng: -0.1547,
    facilities: ["parking", "wheelchair_access", "womens_area", "wudu_area", "library", "community_hall"],
    logoUrl: null,
    coverUrl: null,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "m3000000-0000-0000-0000-000000000003",
    slug: "brixton-mosque",
    name: "Brixton Mosque",
    address: "1 Gresham Rd",
    city: "London",
    postcode: "SW9 7PH",
    country: "GB",
    phone: null,
    email: null,
    website: null,
    lat: 51.4613,
    lng: -0.1146,
    facilities: ["womens_area", "wudu_area"],
    logoUrl: null,
    coverUrl: null,
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z",
  },
  {
    id: "m4000000-0000-0000-0000-000000000004",
    slug: "finsbury-park-mosque",
    name: "Finsbury Park Mosque",
    address: "7-11 St Thomas's Rd",
    city: "London",
    postcode: "N4 2QH",
    country: "GB",
    phone: "+442072723636",
    email: null,
    website: "https://www.finsburyparkmosque.org",
    lat: 51.5649,
    lng: -0.1065,
    facilities: ["parking", "womens_area", "wudu_area", "funeral_services", "community_hall"],
    logoUrl: null,
    coverUrl: null,
    createdAt: "2024-01-04T00:00:00.000Z",
    updatedAt: "2024-01-04T00:00:00.000Z",
  },
];

// bcrypt hash for "password123" with cost 12
const SEED_PASSWORD_HASH =
  "$2b$12$LJ3m4ys3Lk0TSwMCkVc3fuABbEOzK4bCYFsXqfKJoMZHx0CBRNTG.";

const SEED_ADMINS: Admin[] = [
  {
    id: "a1000000-0000-0000-0000-000000000001",
    email: "admin@eastlondonmosque.org.uk",
    name: "Admin User",
    passwordHash: SEED_PASSWORD_HASH,
    mosqueId: "m1000000-0000-0000-0000-000000000001",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

const todayStr = today();
const tomorrowStr = tomorrow();

function makePrayerTime(
  mosqueId: string,
  date: string,
  index: number
): PrayerTimeEntry {
  return {
    id: `pt${index.toString().padStart(6, "0")}-0000-0000-0000-000000000000`,
    mosqueId,
    date,
    fajr: "05:30",
    dhuhr: "12:30",
    asr: "15:45",
    maghrib: "18:15",
    isha: "20:00",
    jummah: "13:15",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

// Seed API key: raw key is "oi_test_abc123def456", prefix is "oi_test_abc1"
const SEED_API_KEY_RAW = "oi_test_abc123def456";
const SEED_API_KEYS: ApiKey[] = [
  {
    id: "k1000000-0000-0000-0000-000000000001",
    prefix: "oi_test_abc1",
    keyHash: sha256(SEED_API_KEY_RAW),
    name: "Dev Test Key",
    contactEmail: "dev@openislam.org",
    rateLimit: 100,
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

// ── Initialize stores ───────────────────────────────────────────────────────

function seed() {
  for (const m of SEED_MOSQUES) mosques.set(m.id, m);
  for (const a of SEED_ADMINS) admins.set(a.id, a);
  for (const k of SEED_API_KEYS) apiKeys.set(k.id, k);

  let ptIndex = 1;
  for (const m of SEED_MOSQUES) {
    const pt1 = makePrayerTime(m.id, todayStr, ptIndex++);
    const pt2 = makePrayerTime(m.id, tomorrowStr, ptIndex++);
    prayerTimes.set(pt1.id, pt1);
    prayerTimes.set(pt2.id, pt2);
  }
}

seed();
