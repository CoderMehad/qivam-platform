import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { createHash } from "node:crypto";
import { mosques, admins, apiKeys } from "../db/schema.js";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error("NEON_DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle(client);

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const MOSQUE_1_ID = "00000000-0000-4000-a000-000000000001";
const MOSQUE_2_ID = "00000000-0000-4000-a000-000000000002";
const MOSQUE_3_ID = "00000000-0000-4000-a000-000000000003";
const MOSQUE_4_ID = "00000000-0000-4000-a000-000000000004";

const SEED_MOSQUES = [
  {
    id: MOSQUE_1_ID,
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
    timezone: "Europe/London",
    facilities: JSON.stringify([
      "parking",
      "wheelchair_access",
      "womens_area",
      "wudu_area",
      "islamic_school",
      "library",
      "community_hall",
    ]),
  },
  {
    id: MOSQUE_2_ID,
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
    timezone: "Europe/London",
    facilities: JSON.stringify([
      "parking",
      "wheelchair_access",
      "womens_area",
      "wudu_area",
      "library",
      "community_hall",
    ]),
  },
  {
    id: MOSQUE_3_ID,
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
    timezone: "Europe/London",
    facilities: JSON.stringify(["womens_area", "wudu_area"]),
  },
  {
    id: MOSQUE_4_ID,
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
    timezone: "Europe/London",
    facilities: JSON.stringify([
      "parking",
      "womens_area",
      "wudu_area",
      "funeral_services",
      "community_hall",
    ]),
  },
];

// bcrypt hash for "password123" with cost 12
const SEED_PASSWORD_HASH =
  "$2b$12$LJ3m4ys3Lk0TSwMCkVc3fuABbEOzK4bCYFsXqfKJoMZHx0CBRNTG.";

const SEED_ADMIN = {
  id: "00000000-0000-4000-b000-000000000001",
  email: "admin@eastlondonmosque.org.uk",
  name: "Admin User",
  passwordHash: SEED_PASSWORD_HASH,
  mosqueId: MOSQUE_1_ID,
};

const SEED_API_KEY_RAW = "qv_test_abc123def456";
const SEED_API_KEY = {
  id: "00000000-0000-4000-c000-000000000001",
  prefix: "qv_test_abc1",
  keyHash: sha256(SEED_API_KEY_RAW),
  name: "Dev Test Key",
  contactEmail: "dev@qivam.com",
  rateLimit: 100,
  isActive: true,
};

// ── Run Seed ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding mosques...");
  await db.insert(mosques).values(SEED_MOSQUES).onConflictDoNothing();

  console.log("Seeding admin...");
  await db.insert(admins).values(SEED_ADMIN).onConflictDoNothing();

  console.log("Seeding API key...");
  await db.insert(apiKeys).values(SEED_API_KEY).onConflictDoNothing();

  console.log("Seed complete.");
  console.log(`  Test API key: ${SEED_API_KEY_RAW}`);
  console.log(`  Admin email: ${SEED_ADMIN.email}`);
  console.log(`  Admin password: password123`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
