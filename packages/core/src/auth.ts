import { randomBytes } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Admin, AdminPublic, Invitation } from "./domain.js";
import { BCRYPT_COST, JWT_EXPIRY } from "./constants.js";
import { BadRequestError, ConflictError } from "./errors.js";
import {
  getAdminByEmail,
  insertAdmin,
  insertInvitation,
  getInvitationByToken,
  markInvitationUsed,
} from "./repository/drizzle.js";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

function toPublic(admin: Admin): AdminPublic {
  const { passwordHash: _, ...rest } = admin;
  return rest;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  mosqueId: string;
  inviteToken: string;
}

export async function register(
  data: RegisterData,
): Promise<{ token: string; admin: AdminPublic }> {
  // Validate invitation
  const invitation = await getInvitationByToken(data.inviteToken);
  if (!invitation) {
    throw new BadRequestError("Invalid invitation token");
  }
  if (invitation.usedAt) {
    throw new BadRequestError("Invitation has already been used");
  }
  if (new Date(invitation.expiresAt) < new Date()) {
    throw new BadRequestError("Invitation has expired");
  }
  if (invitation.email !== data.email) {
    throw new BadRequestError("Email does not match invitation");
  }
  if (invitation.mosqueId !== data.mosqueId) {
    throw new BadRequestError("Mosque does not match invitation");
  }

  const existing = await getAdminByEmail(data.email);
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await hash(data.password, BCRYPT_COST);
  let admin: Admin;
  try {
    admin = await insertAdmin({
      email: data.email,
      name: data.name,
      passwordHash,
      mosqueId: data.mosqueId,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("Email already registered");
    }
    throw err;
  }

  // Mark invitation as used
  await markInvitationUsed(invitation.id);

  const token = await new SignJWT({ sub: admin.id, mosqueId: admin.mosqueId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());

  return { token, admin: toPublic(admin) };
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; admin: AdminPublic } | null> {
  const admin = await getAdminByEmail(email);
  if (!admin) return null;

  const valid = await compare(password, admin.passwordHash);
  if (!valid) return null;

  const token = await new SignJWT({ sub: admin.id, mosqueId: admin.mosqueId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());

  return { token, admin: toPublic(admin) };
}

export async function verifyToken(
  token: string,
): Promise<{ sub: string; mosqueId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    const mosqueId = payload.mosqueId as string | undefined;
    if (!sub || !mosqueId) return null;
    return { sub, mosqueId };
  } catch {
    return null;
  }
}

const INVITE_EXPIRY_HOURS = 72;

export type InvitationPublic = Omit<Invitation, "token">;

export async function createInvitation(
  adminId: string,
  email: string,
  mosqueId: string,
): Promise<InvitationPublic> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

  const invitation = await insertInvitation({
    email,
    mosqueId,
    invitedBy: adminId,
    token,
    expiresAt,
  });

  const { token: _, ...publicInvitation } = invitation;
  return publicInvitation;
}
