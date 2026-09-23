import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { Category } from '../models/Category';
import { Party } from '../models/Party';
import { CheckinLog } from '../models/CheckinLog';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { getOwnedEvent } from './event.controller';

async function performCheckin(guestId: string, req: Request, res: Response, method: 'camera' | 'manual') {
  const guest = await Guest.findById(guestId).populate('partyId', 'name side');
  if (!guest) throw ApiError.notFound('Guest not found for this token.');

  const event = await getOwnedEvent(guest.eventId.toString(), req);
  if (event.status === 'archived' || event.status === 'completed') {
    throw ApiError.gone('EVENT_CLOSED', 'This event is closed and no longer accepting check-ins.');
  }

  if (guest.attendanceStatus === 'present') {
    await CheckinLog.create({ eventId: guest.eventId, guestId: guest._id, result: 'duplicate', scannedBy: req.user!.sub, method });
    const partyData0 = guest.partyId && typeof guest.partyId === 'object' ? (guest as any).partyId : null;
    throw ApiError.conflict('Guest already checked in.', [{
      guestId: guest.id,
      fullName: guest.fullName,
      partyName: partyData0?.name ?? null,
      side: guest.side ?? partyData0?.side ?? null,
      isVip: guest.isVip,
      rsvpStatus: guest.rsvpStatus,
      checkInTime: guest.checkInTime,
    }]);
  }

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
    const already = await Guest.findById(guest._id).populate('partyId', 'name side');
    await CheckinLog.create({ eventId: guest.eventId, guestId: guest._id, result: 'duplicate', scannedBy: req.user!.sub, method });
    const partyData1 = already?.partyId && typeof already.partyId === 'object' ? (already as any).partyId : null;
    throw ApiError.conflict('Guest already checked in.', [{
      guestId: already?.id ?? guest.id,
      fullName: already?.fullName ?? guest.fullName,
      partyName: partyData1?.name ?? null,
      side: already?.side ?? partyData1?.side ?? null,
      isVip: already?.isVip ?? guest.isVip,
      rsvpStatus: already?.rsvpStatus ?? guest.rsvpStatus,
      checkInTime: already?.checkInTime,
    }]);
  }

  await CheckinLog.create({ eventId: guest.eventId, guestId: guest._id, result: 'success', scannedBy: req.user!.sub, method });

  const updated = await Guest.findById(guest._id).populate('partyId', 'name side');
  const category = updated?.categoryId ? await Category.findById(updated.categoryId) : null;
  const partyData = updated?.partyId && typeof updated.partyId === 'object' ? (updated as any).partyId : null;

  return sendSuccess(res, {
    guest: {
      fullName: updated!.fullName,
      firstName: updated!.firstName,
      category: category?.name ?? null,
      partyName: partyData?.name ?? null,
      side: updated!.side ?? partyData?.side ?? null,
      isVip: updated!.isVip,
      rsvpStatus: updated!.rsvpStatus,
    },
    attendanceStatus: updated!.attendanceStatus,
    checkInTime: updated!.checkInTime,
  });
}

/** POST /checkin/lookup — find guest by QR token WITHOUT changing attendance (scan → staff confirms) */
export const lookupScan = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findOne({ qrToken: req.body.token }).populate('partyId', 'name side');
  if (!guest) throw ApiError.notFound('Unknown or invalid QR token.');
  await getOwnedEvent(guest.eventId.toString(), req);

  const category = guest.categoryId ? await Category.findById(guest.categoryId) : null;
  const partyData = guest.partyId && typeof guest.partyId === 'object' ? (guest as any).partyId : null;

  return sendSuccess(res, {
    guestId: guest.id,
    guest: {
      fullName: guest.fullName,
      firstName: guest.firstName,
      category: category?.name ?? null,
      partyName: partyData?.name ?? null,
      side: guest.side ?? partyData?.side ?? null,
      isVip: guest.isVip,
      rsvpStatus: guest.rsvpStatus,
    },
    attendanceStatus: guest.attendanceStatus,
    checkInTime: guest.checkInTime ?? null,
  });
});

/** POST /checkin/scan — staff confirms check-in after reviewing the looked-up guest */
export const scanCheckin = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findOne({ qrToken: req.body.token });
  if (!guest) throw ApiError.notFound('Unknown or invalid QR token.');
  return performCheckin(guest.id, req, res, 'camera');
});

/** POST /checkin/manual/:guestId */
export const manualCheckin = asyncHandler(async (req: Request, res: Response) => {
  return performCheckin(req.params.guestId, req, res, 'manual');
});

/** POST /checkin/undo/:guestId — staff-only reversal of a check-in */
export const undoCheckin = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.guestId).populate('partyId', 'name side');
  if (!guest) throw ApiError.notFound('Guest not found.');
  const event = await getOwnedEvent(guest.eventId.toString(), req);
  if (event.status === 'archived' || event.status === 'completed') {
    throw ApiError.gone('EVENT_CLOSED', 'This event is closed.');
  }
  if (guest.attendanceStatus !== 'present') {
    throw ApiError.conflict('Guest is not checked in.');
  }

  guest.attendanceStatus = 'absent';
  guest.checkInTime = undefined;
  guest.checkedInBy = null;
  await guest.save();

  await CheckinLog.create({
    eventId: guest.eventId,
    guestId: guest._id,
    result: 'undo',
    scannedBy: req.user!.sub,
    method: 'manual',
  });

  return sendSuccess(res, {
    guestId: guest.id,
    fullName: guest.fullName,
    attendanceStatus: guest.attendanceStatus,
  });
});

/** POST /checkin/reentry/:guestId — allow an already checked-in guest to re-enter (no new attendance record) */
export const reentryCheckin = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.guestId).populate('partyId', 'name side');
  if (!guest) throw ApiError.notFound('Guest not found.');
  const event = await getOwnedEvent(guest.eventId.toString(), req);
  if (event.status === 'archived' || event.status === 'completed') {
    throw ApiError.gone('EVENT_CLOSED', 'This event is closed.');
  }
  if (guest.attendanceStatus !== 'present') {
    throw ApiError.conflict('Guest is not checked in.');
  }

  await CheckinLog.create({
    eventId: guest.eventId,
    guestId: guest._id,
    result: 'reentry',
    scannedBy: req.user!.sub,
    method: 'manual',
  });

  const partyData = guest.partyId && typeof guest.partyId === 'object' ? (guest as any).partyId : null;
  return sendSuccess(res, {
    guest: {
      fullName: guest.fullName,
      partyName: partyData?.name ?? null,
      side: guest.side ?? partyData?.side ?? null,
      isVip: guest.isVip,
      rsvpStatus: guest.rsvpStatus,
    },
    attendanceStatus: guest.attendanceStatus,
    checkInTime: guest.checkInTime,
    reentryAllowed: true,
  });
});

/** GET /events/:eventId/checkin/search */
export const searchCheckin = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const q = ((req.query.q as string) ?? '').trim();
  if (!q) return sendSuccess(res, []);

  const guests = await Guest.find({ eventId: event._id, $text: { $search: q } })
    .limit(20)
    .populate('categoryId', 'name')
    .populate('partyId', 'name side');

  const data = guests.map((g: any) => {
    const partyData = g.partyId && typeof g.partyId === 'object' ? g.partyId : null;
    return {
      id: g.id,
      fullName: g.fullName,
      firstName: g.firstName,
      category: g.categoryId?.name ?? null,
      partyName: partyData?.name ?? null,
      side: g.side ?? partyData?.side ?? null,
      isVip: g.isVip,
      rsvpStatus: g.rsvpStatus,
      attendanceStatus: g.attendanceStatus,
    };
  });
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
