import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { Event } from '../models/Event';
import { Party } from '../models/Party';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

/** GET /public/family/:token — public family page data */
export const getFamily = asyncHandler(async (req: Request, res: Response) => {
  const party = await Party.findOne({ token: req.params.token });
  if (!party) throw ApiError.notFound('Family link is invalid.');

  const event = await Event.findById(party.eventId);
  if (!event) throw ApiError.notFound('Event not found.');

  const guests = await Guest.find({ eventId: party.eventId, partyId: party._id });

  return sendSuccess(res, {
    party: {
      name: party.name,
      side: party.side,
    },
    event: {
      name: event.name,
      brideName: event.brideName,
      groomName: event.groomName,
      startDate: event.startDate,
      startTime: event.startTime,
      venue: event.venue,
      branding: event.branding,
    },
    guests: guests.map((g) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      fullName: g.fullName,
      invitationToken: g.invitationToken,
      attendanceStatus: g.attendanceStatus,
    })),
  });
});
