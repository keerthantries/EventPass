import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { Category } from '../models/Category';
import { CheckinLog } from '../models/CheckinLog';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { getOwnedEvent } from './event.controller';

async function performCheckin(guestId: string, req: Request, res: Response, method: 'camera' | 'manual') {
  const guest = await Guest.findById(guestId);
  if (!guest) throw ApiError.notFound('Guest not found for this token.');

  // Ownership check doubles as event resolution: Organizer only for own events,
  // Security only for their organizer's events, super_admin for all. Also blocks
  // check-in once the event is closed.
  const event = await getOwnedEvent(guest.eventId.toString(), req);
  if (event.status === 'archived' || event.status === 'completed') {
    throw ApiError.gone('EVENT_CLOSED', 'This event is closed and no longer accepting check-ins.');
  }

  // Fast-path duplicate check for a friendly message, but the authoritative guard
  // is the atomic updateMany below (no chance of a double check-in from race conditions).
  if (guest.attendanceStatus === 'present') {
    await CheckinLog.create({ eventId: guest.eventId, guestId: guest._id, result: 'duplicate', scannedBy: req.user!.sub, method });
    throw ApiError.conflict('Guest already checked in.', [{ checkInTime: guest.checkInTime }]);
  }

  // Atomic claim: only the first writer flips absent -> present. Any caller that
  // raced here gets 0 modifiedCount and is treated as an already-checked-in guest,
  // guaranteeing no duplicate entry even under concurrent scans.
  const claimed = await Guest.updateOne(
    { _id: guest._id, attendanceStatus: 'absent' },
    {
      $set: {
        attendanceStatus: 'present' as const,
        checkInTime: new Date(),
        checkedInBy: req.user!.sub as any,
      },
    }
  );

  if (claimed.modifiedCount === 0) {
    const already = await Guest.findById(guest._id);
    await CheckinLog.create({ eventId: guest.eventId, guestId: guest._id, result: 'duplicate', scannedBy: req.user!.sub, method });
    throw ApiError.conflict('Guest already checked in.', [{ checkInTime: already?.checkInTime }]);
  }

  await CheckinLog.create({ eventId: guest.eventId, guestId: guest._id, result: 'success', scannedBy: req.user!.sub, method });

  const category = await Category.findById(guest.categoryId);
  return sendSuccess(res, {
    guest: { fullName: guest.fullName, category: category?.name ?? null },
    attendanceStatus: guest.attendanceStatus,
    checkInTime: guest.checkInTime,
  });
}

/** POST /checkin/scan */
export const scanCheckin = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findOne({ qrToken: req.body.token });
  if (!guest) throw ApiError.notFound('Unknown or invalid QR token.');
  return performCheckin(guest.id, req, res, 'camera');
});

/** POST /checkin/manual/:guestId */
export const manualCheckin = asyncHandler(async (req: Request, res: Response) => {
  return performCheckin(req.params.guestId, req, res, 'manual');
});

/** GET /events/:eventId/checkin/search */
export const searchCheckin = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const q = ((req.query.q as string) ?? '').trim();
  if (!q) return sendSuccess(res, []);

  const guests = await Guest.find({ eventId: event._id, $text: { $search: q } }).limit(20).populate('categoryId', 'name');

  const data = guests.map((g: any) => ({
    id: g.id,
    fullName: g.fullName,
    category: g.categoryId?.name ?? null,
    attendanceStatus: g.attendanceStatus,
  }));
  return sendSuccess(res, data);
});

/** GET /events/:eventId/checkin/recent */
export const recentCheckins = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const logs = await CheckinLog.find({ eventId: event._id, result: 'success' })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('guestId', 'fullName');

  const data = logs.map((l: any) => ({ guestName: l.guestId?.fullName, checkInTime: l.createdAt, method: l.method }));
  return sendSuccess(res, data);
});
