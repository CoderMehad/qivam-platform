import { eq } from "drizzle-orm";
import { getDb } from "../adapters/neon.adapter.js";
import { admins } from "../schemas/drizzle.schema.js";
import type { Admin } from "../models/admin.model.js";

// ── Row Mapper ────────────────────────────────────────────────────────────────

function mapAdminRow(row: typeof admins.$inferSelect): Admin {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    mosqueId: row.mosqueId,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAdminByEmail(
  email: string,
): Promise<Admin | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  return rows[0] ? mapAdminRow(rows[0]) : undefined;
}

export async function getAdminById(id: string): Promise<Admin | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);

  return rows[0] ? mapAdminRow(rows[0]) : undefined;
}

export async function insertAdmin(data: {
  email: string;
  name: string;
  passwordHash: string;
  mosqueId: string;
}): Promise<Admin> {
  const db = getDb();
  const rows = await db
    .insert(admins)
    .values({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      mosqueId: data.mosqueId,
    })
    .returning();

  return mapAdminRow(rows[0]);
}
