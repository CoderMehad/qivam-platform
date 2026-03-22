import { z } from "zod";

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export const paginationMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const errorResponse = z.object({
  error: z.string(),
});

export const uuidParam = z.object({
  id: z.string().uuid(),
});
