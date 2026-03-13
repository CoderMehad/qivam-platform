import type { ApiKeyPublic } from "./domain.js";
import { sha256 } from "./repository/helpers.js";
import {
  insertApiKey,
  getApiKeyByPrefix,
  getActiveApiKeyByHash,
} from "./repository/drizzle.js";

function generateRawKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "oi_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export interface RequestData {
  name: string;
  contactEmail: string;
}

export async function request(
  data: RequestData,
): Promise<{ key: string; prefix: string; name: string; isActive: boolean }> {
  const rawKey = generateRawKey();
  const prefix = rawKey.slice(0, 12);

  const inserted = await insertApiKey({
    prefix,
    keyHash: sha256(rawKey),
    name: data.name,
    contactEmail: data.contactEmail,
  });

  return { key: rawKey, prefix, name: inserted.name, isActive: inserted.isActive };
}

export async function getByPrefix(
  prefix: string,
): Promise<ApiKeyPublic | undefined> {
  return getApiKeyByPrefix(prefix);
}

export async function validate(
  rawKey: string,
): Promise<{ id: string; name: string; rateLimit: number } | undefined> {
  const keyHash = sha256(rawKey);
  return getActiveApiKeyByHash(keyHash);
}
