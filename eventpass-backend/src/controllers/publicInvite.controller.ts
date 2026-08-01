import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { Event } from '../models/Event';
import { EventConfig } from '../models/EventConfig';
import { FormSchema } from '../models/FormSchema';
import { FormResponse } from '../models/FormResponse';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { generateQrToken } from '../utils/tokens';
import { generateQrImage } from '../utils/qr';

/** GET /public/invite/:token */
export const getInvitation = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findOne({ invitationToken: req.params.token });
  if (!guest) throw ApiError.notFound('Invitation link is invalid.');

  const [event, config] = await Promise.all([
    Event.findById(guest.eventId),
    EventConfig.findOne({ eventId: guest.eventId }),
  ]);
  if (!event || !config) throw ApiError.notFound('Invitation link is invalid.');

  if (guest.invitationStatus === 'pending') {
    guest.invitationStatus = 'opened';
    await guest.save();
  }

  let formSchemaFields: unknown[] = [];
  if (config.modules.dynamicForm) {
    const schema = await FormSchema.findOne({ eventId: event._id });
    formSchemaFields = schema?.fields ?? [];
  }

  return sendSuccess(res, {
    event: {
      name: event.name,
      banner: event.bannerImage,
      venue: event.venue,
      mapLink: event.mapLink,
      startDate: event.startDate,
      startTime: event.startTime,
      endTime: event.endTime,
      branding: event.branding,
    },
    guest: { fullName: guest.fullName, rsvpStatus: guest.rsvpStatus },
    config: { modules: config.modules, rsvpMode: config.rsvpMode },
    formSchema: formSchemaFields,
  });
});

/** POST /public/invite/:token/rsvp */
export const submitRsvp = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findOne({ invitationToken: req.params.token });
  if (!guest) throw ApiError.notFound('Invitation link is invalid.');

  const [event, config] = await Promise.all([
    Event.findById(guest.eventId),
    EventConfig.findOne({ eventId: guest.eventId }),
  ]);
  if (!event || !config) throw ApiError.notFound('Invitation link is invalid.');
  if (event.status === 'archived' || event.status === 'completed') {
    throw ApiError.unprocessable('EVENT_CLOSED', 'This event is no longer accepting responses.');
  }
  if (config.rsvpDeadline && new Date() > config.rsvpDeadline) {
    throw ApiError.unprocessable('RSVP_CLOSED', 'The RSVP deadline for this event has passed.');
  }

  const { response } = req.body;
  const allowed: Record<string, string[]> = {
    accept_only: ['accepted'],
    accept_decline: ['accepted', 'declined'],
    accept_decline_maybe: ['accepted', 'declined', 'maybe'],
  };
  if (!allowed[config.rsvpMode]?.includes(response)) {
    throw ApiError.badRequest(`"${response}" is not an allowed RSVP response for this event.`);
  }

  guest.rsvpStatus = response;
  guest.rsvpRespondedAt = new Date();

  let nextStep: 'form' | 'qr' | 'done' = 'done';
  if (response === 'accepted' && config.modules.dynamicForm) {
    nextStep = 'form';
  } else if (response === 'accepted' && config.qrGenerationTiming === 'on_rsvp_accept') {
    guest.qrToken = generateQrToken();
    guest.qrGeneratedAt = new Date();
    await generateQrImage(guest.qrToken);
    nextStep = 'qr';
  }

  await guest.save();
  return sendSuccess(res, { rsvpStatus: guest.rsvpStatus, rsvpRespondedAt: guest.rsvpRespondedAt, nextStep });
});

/** POST /public/invite/:token/form */
export const submitFormResponse = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findOne({ invitationToken: req.params.token });
  if (!guest) throw ApiError.notFound('Invitation link is invalid.');

  const [config, schema, existing] = await Promise.all([
    EventConfig.findOne({ eventId: guest.eventId }),
    FormSchema.findOne({ eventId: guest.eventId }),
    FormResponse.findOne({ guestId: guest._id }),
  ]);
  if (!config) throw ApiError.notFound('Invitation link is invalid.');
  if (existing) throw ApiError.conflict('A response has already been submitted for this invitation.');

  const { answers } = req.body;
  for (const field of schema?.fields ?? []) {
    if (field.required && (answers[field.key] === undefined || answers[field.key] === '')) {
      throw ApiError.badRequest(`"${field.label}" is required.`, [{ field: field.key }]);
    }
    if (field.options && field.options.length > 0 && answers[field.key] !== undefined && !field.options.includes(answers[field.key])) {
      throw ApiError.badRequest(`"${answers[field.key]}" is not a valid option for "${field.label}".`, [{ field: field.key }]);
    }
  }

  await FormResponse.create({ eventId: guest.eventId, guestId: guest._id, answers });

  if (config.requiresApproval) {
    guest.approvalStatus = 'pending';
    await guest.save();
    return sendSuccess(res, { submitted: true, approvalStatus: 'pending', qrToken: null });
  }

  if (config.qrGenerationTiming === 'on_rsvp_accept' || config.qrGenerationTiming === 'on_add') {
    if (!guest.qrToken) {
      guest.qrToken = generateQrToken();
      guest.qrGeneratedAt = new Date();
      await generateQrImage(guest.qrToken);
      await guest.save();
    }
  }

  return sendSuccess(res, { submitted: true, approvalStatus: guest.approvalStatus, qrToken: guest.qrToken ?? null });
});
