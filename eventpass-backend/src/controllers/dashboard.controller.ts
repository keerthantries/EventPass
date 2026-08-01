import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { CheckinLog } from '../models/CheckinLog';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getOwnedEvent } from './event.controller';

/** GET /events/:eventId/dashboard — summary cards + widgets (API spec §1.5). */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const eventId = event._id;

  const [totalGuests, invitationsSent, rsvpAccepted, rsvpDeclined, pendingResponses, presentGuests] = await Promise.all([
    Guest.countDocuments({ eventId }),
    Guest.countDocuments({ eventId, invitationStatus: { $in: ['sent', 'opened'] } }),
    Guest.countDocuments({ eventId, rsvpStatus: 'accepted' }),
    Guest.countDocuments({ eventId, rsvpStatus: 'declined' }),
    Guest.countDocuments({ eventId, rsvpStatus: 'pending' }),
    Guest.countDocuments({ eventId, attendanceStatus: 'present' }),
  ]);
  const absentGuests = totalGuests - presentGuests;
  const attendancePercentage = totalGuests > 0 ? Math.round((presentGuests / totalGuests) * 1000) / 10 : 0;

  const attendanceTrendAgg = await CheckinLog.aggregate([
    { $match: { eventId, result: 'success' } },
    { $group: { _id: { $dateToString: { format: '%H:00', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const attendanceTrend = attendanceTrendAgg.map((a) => ({ hour: a._id, count: a.count }));

  const rsvpDistribution = [
    { status: 'accepted', count: rsvpAccepted },
    { status: 'declined', count: rsvpDeclined },
    { status: 'pending', count: pendingResponses },
  ];

  const recentLogs = await CheckinLog.find({ eventId, result: 'success' })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('guestId', 'fullName');
  const recentActivity = recentLogs.map((l: any) => ({ type: 'checkin', guestName: l.guestId?.fullName, at: l.createdAt }));

  const liveGuests = await Guest.find({ eventId, attendanceStatus: 'present' })
    .sort({ checkInTime: -1 })
    .limit(10)
    .populate('categoryId', 'name');
  const liveCheckins = liveGuests.map((g: any) => ({
    guestName: g.fullName,
    category: g.categoryId?.name ?? null,
    checkInTime: g.checkInTime,
  }));

  return sendSuccess(res, {
    summary: {
      totalGuests,
      invitationsSent,
      rsvpAccepted,
      rsvpDeclined,
      pendingResponses,
      presentGuests,
      absentGuests,
      attendancePercentage,
    },
    attendanceTrend,
    rsvpDistribution,
    recentActivity,
    liveCheckins,
  });
});
