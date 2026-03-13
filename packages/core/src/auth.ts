import { hash, compare } from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import type { Admin, AdminPublic } from "./domain.js";
import { BCRYPT_COST, JWT_EXPIRY } from "./constants.js";
import { getAdminByEmail, insertAdmin } from "./repository/drizzle.js";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
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
}

export async function register(
  data: RegisterData
): Promise<{ token: string; admin: AdminPublic }> {
  const existing = await getAdminByEmail(data.email);
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hash(data.password, BCRYPT_COST);
  const admin = await insertAdmin({
    email: data.email,
    name: data.name,
    passwordHash,
    mosqueId: data.mosqueId,
  });

  const token = await new SignJWT({ sub: admin.id, mosqueId: data.mosqueId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());

  return { token, admin: toPublic(admin) };
}

export async function login(
  email: string,
  password: string
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
  token: string
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
