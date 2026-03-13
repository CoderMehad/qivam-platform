import type { Mosque } from "./domain.js";
import { MAX_PAGE_SIZE } from "./constants.js";
import {
  mosques,
  generateId,
  now,
  slugify,
  haversineKm,
  encodeCursor,
  decodeCursor,
} from "./repository/mock.js";

export interface ListParams {
  cursor?: string;
  limit?: number;
  city?: string;
}

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export interface CreateMosqueData {
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  lat: number;
  lng: number;
  facilities?: Mosque["facilities"];
}

export interface UpdateMosqueData {
  name?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  lat?: number;
  lng?: number;
  facilities?: Mosque["facilities"];
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export function list(params: ListParams = {}): {
  data: Mosque[];
  cursor: string | null;
  hasMore: boolean;
} {
  const limit = Math.min(params.limit ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
  let items = Array.from(mosques.values()).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );

  if (params.city) {
    const cityLower = params.city.toLowerCase();
    items = items.filter((m) => m.city.toLowerCase() === cityLower);
  }

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      const idx = items.findIndex(
        (m) =>
          m.createdAt > decoded.createdAt ||
          (m.createdAt === decoded.createdAt && m.id > decoded.id)
      );
      items = idx === -1 ? [] : items.slice(idx);
    }
  }

  const page = items.slice(0, limit);
  const hasMore = items.length > limit;
  const lastItem = page[page.length - 1];
  const cursor = lastItem && hasMore
    ? encodeCursor(lastItem.createdAt, lastItem.id)
    : null;

  return { data: page, cursor, hasMore };
}

export function getByIdOrSlug(idOrSlug: string): Mosque | undefined {
  const direct = mosques.get(idOrSlug);
  if (direct) return direct;
  return Array.from(mosques.values()).find((m) => m.slug === idOrSlug);
}

export function nearby(
  params: NearbyParams
): Array<Mosque & { distance_km: number }> {
  const radiusKm = params.radiusKm ?? 10;
  const limit = Math.min(params.limit ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);

  const results = Array.from(mosques.values())
    .map((m) => ({
      ...m,
      distance_km: Math.round(haversineKm(params.lat, params.lng, m.lat, m.lng) * 100) / 100,
    }))
    .filter((m) => m.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);

  return results;
}

export function create(data: CreateMosqueData): Mosque {
  const id = generateId();
  const timestamp = now();
  const mosque: Mosque = {
    id,
    slug: slugify(data.name),
    name: data.name,
    address: data.address,
    city: data.city,
    postcode: data.postcode,
    country: data.country,
    phone: data.phone ?? null,
    email: data.email ?? null,
    website: data.website ?? null,
    lat: data.lat,
    lng: data.lng,
    facilities: data.facilities ?? [],
    logoUrl: null,
    coverUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mosques.set(id, mosque);
  return mosque;
}

export function update(id: string, data: UpdateMosqueData): Mosque | undefined {
  const existing = mosques.get(id);
  if (!existing) return undefined;

  const updated: Mosque = {
    ...existing,
    ...data,
    slug: data.name ? slugify(data.name) : existing.slug,
    updatedAt: now(),
  };
  mosques.set(id, updated);
  return updated;
}

export function remove(id: string): boolean {
  return mosques.delete(id);
}
