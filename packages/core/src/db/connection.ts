import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
  return db;
}
