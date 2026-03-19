import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  timestamp,
  boolean,
  integer,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";


// ── Mosques ──────────────────────────────────────────────────────────────────

export const mosques = pgTable(
  "mosques",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    postcode: varchar("postcode", { length: 20 }).notNull(),
    country: varchar("country", { length: 10 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 500 }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    facilities: text("facilities").notNull().default("[]"),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mosques_city_idx").on(table.city),
    index("mosques_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

// ── Admins ───────────────────────────────────────────────────────────────────

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  mosqueId: uuid("mosque_id")
    .notNull()
    .references(() => mosques.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Invitations ─────────────────────────────────────────────────────────────

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  mosqueId: uuid("mosque_id")
    .notNull()
    .references(() => mosques.id, { onDelete: "cascade" }),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Prayer Times ─────────────────────────────────────────────────────────────

export const prayerTimes = pgTable(
  "prayer_times",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mosqueId: uuid("mosque_id")
      .notNull()
      .references(() => mosques.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    fajr: varchar("fajr", { length: 10 }).notNull(),
    dhuhr: varchar("dhuhr", { length: 10 }).notNull(),
    asr: varchar("asr", { length: 10 }).notNull(),
    maghrib: varchar("maghrib", { length: 10 }).notNull(),
    isha: varchar("isha", { length: 10 }).notNull(),
    jummah: varchar("jummah", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("prayer_times_mosque_date_idx").on(table.mosqueId, table.date),
  ],
);

// ── API Keys ─────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prefix: varchar("prefix", { length: 20 }).notNull().unique(),
    keyHash: text("key_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    rateLimit: integer("rate_limit").notNull().default(100),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("api_keys_key_hash_idx").on(table.keyHash)],
);
