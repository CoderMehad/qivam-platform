import { z } from "zod";

export const paginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export const errorResponse = z.object({
  error: z.string(),
});

export const uuidParam = z.object({
  id: z.string().uuid(),
});
