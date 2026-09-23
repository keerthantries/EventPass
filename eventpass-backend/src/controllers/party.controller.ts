import { Request, Response } from 'express';
import { Party } from '../models/Party';
import { Guest } from '../models/Guest';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getOwnedEvent } from './event.controller';

/** GET /events/:eventId/parties */
export const listParties = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const parties = await Party.find({ eventId: event._id }).sort({ name: 1 });

  const counts = await Guest.aggregate([
    { $match: { eventId: event._id, partyId: { $ne: null } } },
    { $group: { _id: '$partyId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c: { _id: string; count: number }) => [String(c._id), c.count]));

  return sendSuccess(
    res,
    parties.map((p) => ({
      _id: p.id,
      eventId: event.id,
      name: p.name,
      side: p.side,
      token: p.token,
      externalId: p.externalId ?? null,
      guestCount: countMap.get(String(p._id)) ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );
});
