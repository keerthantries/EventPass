import { z } from 'zod';

export const createGuestSchema = z.object({
  fullName: z.string().min(2).max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  category: z.string().optional(),
  partyId: z.string().optional(),
  side: z.string().max(50).optional(),
  isVip: z.boolean().optional(),
  isImmediateFamily: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateGuestSchema = createGuestSchema.partial();

export const listGuestsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined', 'maybe']).optional(),
  attendanceStatus: z.enum(['present', 'absent']).optional(),
  category: z.string().optional(),
  side: z.string().optional(),
  isVip: z.string().optional(),
  isImmediateFamily: z.string().optional(),
  partyId: z.string().optional(),
  invitationStatus: z.enum(['not_sent', 'sent', 'opened']).optional(),
  q: z.string().optional(),
  sort: z
    .enum([
      'fullName',
      '-fullName',
      'createdAt',
      '-createdAt',
      'checkInTime',
      '-checkInTime',
      'side',
      '-side',
    ])
    .optional(),
});

export const bulkGuestActionSchema = z.object({
  guestIds: z.array(z.string()).min(1),
  action: z.enum([
    'reassignCategory',
    'delete',
    'setSide',
    'setVip',
    'setImmediateFamily',
    'assignParty',
    'generateBulkQr',
    'markSent',
  ]),
  categoryId: z.string().optional(),
  side: z.string().optional(),
  isVip: z.boolean().optional(),
  isImmediateFamily: z.boolean().optional(),
  partyId: z.string().optional(),
});

export const approveGuestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});
