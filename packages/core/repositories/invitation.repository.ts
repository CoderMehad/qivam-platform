import { eq, desc, count } from "drizzle-orm";
import { getDb } from "../adapters/neon.adapter.js";
import { invitations } from "../schemas/drizzle.schema.js";
import type { Invitation, InvitationPublic } from "../models/invitation.model.js";
import type { PaginatedResult } from "../models/shared.model.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// ── Row Mapper ────────────────────────────────────────────────────────────────

function mapInvitationRow(row: typeof invitations.$inferSelect): Invitation {
  return {
    id: row.id,
    email: row.email,
    mosqueId: row.mosqueId,
    invitedBy: row.invitedBy,
    token: row.token,
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function insertInvitation(data: {
  email: string;
  mosqueId: string;
  invitedBy: string;
  token: string;
  expiresAt: Date;
}): Promise<Invitation> {
  const db = getDb();
  const rows = await db
    .insert(invitations)
    .values({
      email: data.email,
      mosqueId: data.mosqueId,
      invitedBy: data.invitedBy,
      token: data.token,
      expiresAt: data.expiresAt,
    })
    .returning();

  return mapInvitationRow(rows[0]);
}

export async function getInvitationByToken(
  token: string,
): Promise<Invitation | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  return rows[0] ? mapInvitationRow(rows[0]) : undefined;
}

export async function markInvitationUsed(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.id, id));
}

export async function listInvitations(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<InvitationPublic>> {
  const db = getDb();
  const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(invitations)
      .orderBy(desc(invitations.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(invitations),
  ]);

  const total = Number(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map((row) => {
      const { token: _, ...pub } = mapInvitationRow(row);
      return pub;
    }),
    page,
    limit,
    total,
    totalPages,
  };
}
