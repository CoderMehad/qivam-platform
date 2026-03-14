import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

export type Database = NeonHttpDatabase<typeof schema>;

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error("NEON_DATABASE_URL environment variable is not set");
    }
    const client = neon(connectionString);
    db = drizzle(client, { schema });
  }
  return db;
}

export async function pingDb(): Promise<void> {
  const db = getDb();
  await db.execute(sql`SELECT 1`);
}
