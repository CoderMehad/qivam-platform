import { z } from "zod";

export const requestApiKey = z.object({
  name: z.string().min(1).max(100),
  contactEmail: z.string().email(),
});

export const apiKeyResponse = z.object({
  key: z.string(),
  prefix: z.string(),
  name: z.string(),
  isActive: z.boolean(),
});

export const apiKeyStatus = z.object({
  prefix: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
