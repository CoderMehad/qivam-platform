import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const tokenResponse = z.object({
  token: z.string(),
  admin: z.object({
    id: z.string().uuid(),
    email: z.string(),
    name: z.string(),
    mosqueId: z.string().uuid().nullable(),
    createdAt: z.string(),
  }),
});
