import { z } from 'zod';

const baseEventFields = {
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  type: z.string().min(1).max(50),
  venue: z.string().max(300).optional(),
  mapLink: z.string().url().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().optional(),
  bannerImage: z.string().optional(),
  coverImage: z.string().optional(),
  logo: z.string().optional(),
};

export const createEventSchema = z
  .object(baseEventFields)
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const updateEventSchema = z.object(baseEventFields).partial();

export const listEventsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['draft', 'published', 'completed', 'archived']).optional(),
  type: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['name', '-name', 'startDate', '-startDate', 'createdAt', '-createdAt']).optional(),
});

export const updateEventConfigSchema = z.object({
  modules: z
    .object({
      invitation: z.boolean().optional(),
      rsvp: z.boolean().optional(),
      dynamicForm: z.boolean().optional(),
      qrCheckin: z.boolean().optional(),
      csvImport: z.boolean().optional(),
      reports: z.boolean().optional(),
    })
    .optional(),
  rsvpMode: z.enum(['disabled', 'accept_only', 'accept_decline', 'accept_decline_maybe']).optional(),
  rsvpDeadline: z.coerce.date().optional(),
  rsvpMessages: z.object({ confirmation: z.string().optional(), thankYou: z.string().optional() }).optional(),
  workflow: z.enum(['add_qr_checkin', 'invite_rsvp', 'invite_rsvp_form_qr', 'invite_form_approval_qr']).optional(),
  qrGenerationTiming: z.enum(['on_add', 'on_rsvp_accept', 'on_approval']).optional(),
  requiresApproval: z.boolean().optional(),
});

export const updateBrandingSchema = z.object({
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});
