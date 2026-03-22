export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type MosqueFacility =
  | "parking"
  | "wheelchair_access"
  | "womens_area"
  | "wudu_area"
  | "funeral_services"
  | "islamic_school"
  | "library"
  | "community_hall";

export interface Mosque {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number;
  lng: number;
  timezone: string;
  facilities: MosqueFacility[];
  logoUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  mosqueId: string;
  createdAt: string;
}

export interface PrayerTimeEntry {
  id: string;
  mosqueId: string;
  date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  prefix: string;
  keyHash: string;
  name: string;
  contactEmail: string;
  rateLimit: number;
  isActive: boolean;
  analyticsOptOut: boolean;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  mosqueId: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type AdminPublic = Omit<Admin, "passwordHash">;

export type ApiKeyPublic = Omit<ApiKey, "keyHash">;

export type InvitationPublic = Omit<Invitation, "token">;
