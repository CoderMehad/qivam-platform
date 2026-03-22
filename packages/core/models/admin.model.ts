export interface Admin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  mosqueId: string;
  createdAt: string;
}

export type AdminPublic = Omit<Admin, "passwordHash">;
