import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Admin, AdminPublic } from "../models/admin.model.js";
import { BCRYPT_COST, JWT_EXPIRY } from "../constants.js";
import { BadRequestError, ConflictError } from "../errors.js";
import {
  getAdminByEmail,
  insertAdmin,
} from "../repositories/admin.repository.js";

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

function issueToken(adminId: string): Promise<string> {
  return new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export async function register(
  data: RegisterData,
): Promise<{ token: string; admin: AdminPublic }> {
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
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("Email already registered");
    }
    throw err;
  }

  const token = await issueToken(admin.id);
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

  const token = await issueToken(admin.id);
  return { token, admin: toPublic(admin) };
}

export async function verifyToken(
  token: string,
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    if (!sub) return null;
    return { sub };
  } catch {
    return null;
  }
}
