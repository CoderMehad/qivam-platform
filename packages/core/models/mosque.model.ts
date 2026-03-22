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
