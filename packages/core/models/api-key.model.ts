export interface ApiKey {
  id: string;
  prefix: string;
  keyHash: string;
  name: string;
  contactEmail: string;
  rateLimit: number;
  isActive: boolean;
  analyticsEnabled: boolean;
  createdAt: string;
}

export type ApiKeyPublic = Omit<ApiKey, "keyHash">;
