import { z } from 'zod';

export const scanSchema = z.object({
  token: z.string().min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
});
