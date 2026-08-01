import { z } from 'zod';

export const createGuestSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  category: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateGuestSchema = createGuestSchema.partial();

export const listGuestsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined', 'maybe']).optional(),
  attendanceStatus: z.enum(['present', 'absent']).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['fullName', '-fullName', 'createdAt', '-createdAt', 'checkInTime', '-checkInTime']).optional(),
});

export const bulkGuestActionSchema = z.object({
  guestIds: z.array(z.string()).min(1),
  action: z.enum(['reassignCategory', 'delete']),
  categoryId: z.string().optional(),
});

export const approveGuestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});
