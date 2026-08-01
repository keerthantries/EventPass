import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { Guest } from '../models/Guest';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { parsePagination, buildMeta } from '../utils/pagination';
import { getOwnedEvent } from './event.controller';

/** GET /events/:eventId/reports/attendance */
export const attendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { page, limit, skip } = parsePagination(req.query, 100);
  const { category, attendanceStatus } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = { eventId: event._id };
  if (category) filter.categoryId = category;
  if (attendanceStatus) filter.attendanceStatus = attendanceStatus;

  const [guests, total] = await Promise.all([
    Guest.find(filter).populate('categoryId', 'name').skip(skip).limit(limit),
    Guest.countDocuments(filter),
  ]);

  const data = guests.map((g: any) => ({
    guestName: g.fullName,
    category: g.categoryId?.name ?? null,
    rsvpStatus: g.rsvpStatus,
    attendanceStatus: g.attendanceStatus,
    checkInTime: g.checkInTime ?? null,
  }));

  return sendSuccess(res, data, 200, buildMeta(page, limit, total));
});

/** GET /events/:eventId/reports/rsvp */
export const rsvpReport = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { page, limit, skip } = parsePagination(req.query, 100);

  const [guests, total] = await Promise.all([
    Guest.find({ eventId: event._id }).populate('categoryId', 'name').skip(skip).limit(limit),
    Guest.countDocuments({ eventId: event._id }),
  ]);

  const data = guests.map((g: any) => ({
    guestName: g.fullName,
    category: g.categoryId?.name ?? null,
    rsvpStatus: g.rsvpStatus,
    rsvpRespondedAt: g.rsvpRespondedAt ?? null,
  }));

  return sendSuccess(res, data, 200, buildMeta(page, limit, total));
});

async function streamReport(res: Response, filename: string, rows: Record<string, unknown>[], format: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Report');
  sheet.columns = Object.keys(rows[0] ?? { value: '' }).map((key) => ({ header: key, key }));
  sheet.addRows(rows);

  if (format === 'xlsx') {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    return res.end();
  }
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.setHeader('Content-Type', 'text/csv');
  return res.send(await workbook.csv.writeBuffer());
}

/** GET /events/:eventId/reports/attendance/export — capped at 20,000 rows (API spec §1.5). */
export const exportAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';
  const guests = await Guest.find({ eventId: event._id }).limit(20000).populate('categoryId', 'name');

  const rows = guests.map((g: any) => ({
    guestName: g.fullName,
    category: g.categoryId?.name ?? '',
    rsvpStatus: g.rsvpStatus,
    attendanceStatus: g.attendanceStatus,
    checkInTime: g.checkInTime ?? '',
  }));
  await streamReport(res, `attendance-${event.id}`, rows, format);
});

/** GET /events/:eventId/reports/rsvp/export */
export const exportRsvpReport = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';
  const guests = await Guest.find({ eventId: event._id }).limit(20000).populate('categoryId', 'name');

  const rows = guests.map((g: any) => ({
    guestName: g.fullName,
    category: g.categoryId?.name ?? '',
    rsvpStatus: g.rsvpStatus,
    rsvpRespondedAt: g.rsvpRespondedAt ?? '',
  }));
  await streamReport(res, `rsvp-${event.id}`, rows, format);
});
