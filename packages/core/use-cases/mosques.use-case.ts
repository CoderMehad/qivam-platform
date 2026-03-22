import type { Mosque } from "../models/mosque.model.js";
import type { PaginatedResult } from "../models/shared.model.js";
import { MAX_PAGE_SIZE } from "../constants.js";
import {
  listMosques,
  getMosqueByIdOrSlug as dbGetByIdOrSlug,
  nearbyMosques,
  insertMosque,
  updateMosque as dbUpdateMosque,
  deleteMosque,
} from "../repositories/mosque.repository.js";

export interface ListParams {
  page?: number;
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
  timezone?: string;
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
  timezone?: string;
  facilities?: Mosque["facilities"];
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export async function list(params: ListParams = {}): Promise<PaginatedResult<Mosque>> {
  return listMosques(params);
}

export async function getByIdOrSlug(
  idOrSlug: string,
): Promise<Mosque | undefined> {
  return dbGetByIdOrSlug(idOrSlug);
}

export async function nearby(
  params: NearbyParams,
): Promise<Array<Mosque & { distance_km: number }>> {
  const radiusKm = params.radiusKm ?? 10;
  const limit = Math.min(params.limit ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
  return nearbyMosques(params.lat, params.lng, radiusKm, limit);
}

export async function create(data: CreateMosqueData): Promise<Mosque> {
  return insertMosque(data);
}

export async function update(
  id: string,
  data: UpdateMosqueData,
): Promise<Mosque | undefined> {
  return dbUpdateMosque(id, data);
}

export async function remove(id: string): Promise<boolean> {
  return deleteMosque(id);
}
