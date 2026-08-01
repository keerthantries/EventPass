import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  colorTag: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
