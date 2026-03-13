import type { ApiKeyPublic } from "./domain.js";
import type { ApiKey } from "./domain.js";
import { apiKeys, generateId, now, sha256 } from "./repository/mock.js";

function generateRawKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "oi_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function toPublic(key: ApiKey): ApiKeyPublic {
  const { keyHash: _, ...rest } = key;
  return rest;
}

export interface RequestData {
  name: string;
  contactEmail: string;
}

export function request(
  data: RequestData
): { key: string; prefix: string; name: string; isActive: boolean } {
  const rawKey = generateRawKey();
  const prefix = rawKey.slice(0, 12);
  const id = generateId();

  const apiKey: ApiKey = {
    id,
    prefix,
    keyHash: sha256(rawKey),
    name: data.name,
    contactEmail: data.contactEmail,
    rateLimit: 100,
    isActive: false, // Requires manual approval
    createdAt: now(),
  };
  apiKeys.set(id, apiKey);

  return { key: rawKey, prefix, name: data.name, isActive: false };
}

export function getByPrefix(prefix: string): ApiKeyPublic | undefined {
  const found = Array.from(apiKeys.values()).find((k) => k.prefix === prefix);
  return found ? toPublic(found) : undefined;
}

export function validate(
  rawKey: string
): { id: string; name: string; rateLimit: number } | undefined {
  const keyHash = sha256(rawKey);
  const found = Array.from(apiKeys.values()).find(
    (k) => k.keyHash === keyHash && k.isActive
  );
  if (!found) return undefined;
  return { id: found.id, name: found.name, rateLimit: found.rateLimit };
}
