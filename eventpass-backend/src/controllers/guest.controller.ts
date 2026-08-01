import { Request, Response } from 'express';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver: (format: 'zip', options?: Record<string, unknown>) => any = require('archiver');
import ExcelJS from 'exceljs';
import { Guest } from '../models/Guest';
import { Category } from '../models/Category';
import { EventConfig } from '../models/EventConfig';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { parsePagination, buildMeta } from '../utils/pagination';
import { generateInvitationToken, generateQrToken } from '../utils/tokens';
import { generateQrImage, qrFilePath } from '../utils/qr';
import { parseGuestCsv } from '../utils/csv';
import { getOwnedEvent } from './event.controller';
import { writeAuditLog } from '../models/AuditLog';

/** GET /events/:eventId/guests */
export const listGuests = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { page, limit, skip } = parsePagination(req.query, 200);
  const { rsvpStatus, attendanceStatus, category, q, sort } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = { eventId: event._id };
  if (rsvpStatus) filter.rsvpStatus = rsvpStatus;
  if (attendanceStatus) filter.attendanceStatus = attendanceStatus;
  if (category) filter.categoryId = category;
  if (q) filter.$text = { $search: q };

  let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort) {
    const dir = sort.startsWith('-') ? -1 : 1;
    sortSpec = { [sort.replace(/^-/, '')]: dir };
  }

  const [guests, total] = await Promise.all([
    Guest.find(filter).sort(sortSpec).skip(skip).limit(limit),
    Guest.countDocuments(filter),
  ]);

  const projected = res.locals.projectGuests(guests.map((g) => g.toObject()));
  return sendSuccess(res, projected, 200, buildMeta(page, limit, total));
});

/** POST /events/:eventId/guests */
export const createGuest = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { fullName, email, phone, category, notes } = req.body;

  if (category) {
    const cat = await Category.findOne({ _id: category, eventId: event._id });
    if (!cat) throw ApiError.badRequest('Category does not exist for this event.');
  }

  if (email) {
    const dup = await Guest.findOne({ eventId: event._id, email: email.toLowerCase() });
    if (dup) throw ApiError.conflict('A guest with this email already exists for this event.');
  }

  const guest = await Guest.create({
    eventId: event._id,
    categoryId: category ?? null,
    fullName,
    email,
    phone,
    notes,
    invitationToken: generateInvitationToken(),
  });

  const config = await EventConfig.findOne({ eventId: event._id });
  if (config?.qrGenerationTiming === 'on_add') {
    guest.qrToken = generateQrToken();
    guest.qrGeneratedAt = new Date();
    await guest.save();
    await generateQrImage(guest.qrToken);
  }

  return sendSuccess(res, res.locals.projectGuest(guest.toObject()), 201);
});

/** PATCH /events/:eventId/guests/bulk */
export const bulkGuestAction = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { guestIds, action, categoryId } = req.body;

  if (action === 'reassignCategory') {
    if (!categoryId) throw ApiError.badRequest('categoryId is required for reassignCategory.');
    const category = await Category.findOne({ _id: categoryId, eventId: event._id });
    if (!category) throw ApiError.notFound('Category not found for this event.');
    const result = await Guest.updateMany({ _id: { $in: guestIds }, eventId: event._id }, { categoryId });
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  if (action === 'delete') {
    const result = await Guest.deleteMany({ _id: { $in: guestIds }, eventId: event._id });
    return sendSuccess(res, { updated: result.deletedCount });
  }

  throw ApiError.badRequest('Unsupported bulk action.');
});

/** POST /events/:eventId/guests/import — see API spec §1.6 for full behavior contract. */
export const importGuests = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);

  if (!req.file) throw ApiError.badRequest('A CSV file is required (multipart field name: file).');
  if (req.file.size > 5 * 1024 * 1024) throw ApiError.badRequest('File exceeds the 5MB limit.');

  const rows = await parseGuestCsv(req.file.buffer);
  if (rows.length > 5000) throw ApiError.badRequest('CSV exceeds the 5,000 row limit.');

  const categoryCache = new Map<string, string>();
  async function resolveCategory(name?: string): Promise<string | null> {
    if (!name) return null;
    const key = name.trim().toLowerCase();
    if (categoryCache.has(key)) return categoryCache.get(key)!;
    let cat = await Category.findOne({ eventId: event._id, name: new RegExp(`^${name.trim()}$`, 'i') });
    if (!cat) cat = await Category.create({ eventId: event._id, name: name.trim() });
    categoryCache.set(key, cat.id);
    return cat.id;
  }

  let imported = 0;
  let skippedDuplicates = 0;
  const errors: { row: number; reason: string }[] = [];

  for (const row of rows) {
    if (!row.fullName) {
      errors.push({ row: row.row, reason: 'fullName is required' });
      continue;
    }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: row.row, reason: 'invalid email format' });
      continue;
    }

    if (row.email) {
      const dup = await Guest.findOne({ eventId: event._id, email: row.email.toLowerCase() });
      if (dup) {
        skippedDuplicates += 1;
        continue;
      }
    }

    const categoryId = await resolveCategory(row.category);
    await Guest.create({
      eventId: event._id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      notes: row.notes,
      categoryId,
      invitationToken: generateInvitationToken(),
    });
    imported += 1;
  }

  await writeAuditLog(req.user!.sub, 'guest.import', 'Event', event.id, { imported, skippedDuplicates, failed: errors.length });

  return sendSuccess(res, { totalRows: rows.length, imported, skippedDuplicates, failed: errors.length, errors });
});

/** GET /events/:eventId/guests/export */
export const exportGuests = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';
  const guests = await Guest.find({ eventId: event._id }).populate('categoryId', 'name');

  const rows = guests.map((g: any) => ({
    fullName: g.fullName,
    email: g.email ?? '',
    phone: g.phone ?? '',
    category: g.categoryId?.name ?? '',
    rsvpStatus: g.rsvpStatus,
    attendanceStatus: g.attendanceStatus,
    checkInTime: g.checkInTime ?? '',
  }));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Guests');
  sheet.columns = Object.keys(rows[0] ?? { fullName: '' }).map((key) => ({ header: key, key }));
  sheet.addRows(rows);

  if (format === 'xlsx') {
    res.setHeader('Content-Disposition', `attachment; filename="guests-${event.id}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    return res.end();
  }

  res.setHeader('Content-Disposition', `attachment; filename="guests-${event.id}.csv"`);
  res.setHeader('Content-Type', 'text/csv');
  const buffer = await workbook.csv.writeBuffer();
  return res.send(buffer);
});

/** GET /guests/:id */
export const getGuest = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);
  return sendSuccess(res, res.locals.projectGuest(guest.toObject()));
});

/** PATCH /guests/:id */
export const updateGuest = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);

  if (req.body.category !== undefined) {
    if (req.body.category) {
      const cat = await Category.findOne({ _id: req.body.category, eventId: guest.eventId });
      if (!cat) throw ApiError.badRequest('Category does not exist for this event.');
    }
    guest.categoryId = req.body.category || null;
    delete req.body.category;
  }
  Object.assign(guest, req.body);
  await guest.save();
  return sendSuccess(res, res.locals.projectGuest(guest.toObject()));
});

/** DELETE /guests/:id — FormResponse cascade-deleted; CheckinLog retained for audit (DB design §2.5). */
export const deleteGuest = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);

  const { FormResponse } = await import('../models/FormResponse');
  await FormResponse.deleteOne({ guestId: guest._id });
  await guest.deleteOne();

  return sendSuccess(res, { id: req.params.id, deleted: true });
});

/** POST /guests/:id/qr — generate or regenerate. */
export const generateGuestQr = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);

  guest.qrToken = generateQrToken();
  guest.qrGeneratedAt = new Date();
  await guest.save();
  await generateQrImage(guest.qrToken);

  return sendSuccess(res, { qrToken: guest.qrToken, qrGeneratedAt: guest.qrGeneratedAt });
});

/** GET /guests/:id/qr/download */
export const downloadGuestQr = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);
  if (!guest.qrToken) throw ApiError.notFound('QR has not been generated for this guest yet.');

  const filePath = qrFilePath(guest.qrToken);
  if (!fs.existsSync(filePath)) await generateQrImage(guest.qrToken);
  res.download(filePath, `${guest.fullName.replace(/\s+/g, '_')}-qr.png`);
});

/** GET /events/:eventId/guests/qr/download-all — ZIP of all QR images (PRD §13). */
export const downloadAllQr = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const guests = await Guest.find({ eventId: event._id, qrToken: { $ne: null } });

  res.setHeader('Content-Disposition', `attachment; filename="qr-codes-${event.id}.zip"`);
  res.setHeader('Content-Type', 'application/zip');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const guest of guests) {
    if (!guest.qrToken) continue;
    const filePath = qrFilePath(guest.qrToken);
    if (!fs.existsSync(filePath)) await generateQrImage(guest.qrToken);
    archive.file(filePath, { name: `${guest.fullName.replace(/\s+/g, '_')}.png` });
  }

  await archive.finalize();
});

/** POST /guests/:id/approve — Flow 4 only (API spec §1.5). */
export const approveGuest = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  const event = await getOwnedEvent(guest.eventId.toString(), req);

  const config = await EventConfig.findOne({ eventId: event._id });
  if (!config?.requiresApproval) throw ApiError.moduleDisabled('Approval is not required for this event.');

  guest.approvalStatus = req.body.decision;

  if (req.body.decision === 'approved' && config.qrGenerationTiming === 'on_approval') {
    guest.qrToken = generateQrToken();
    guest.qrGeneratedAt = new Date();
    await generateQrImage(guest.qrToken);
  }

  await guest.save();
  return sendSuccess(res, { approvalStatus: guest.approvalStatus, qrToken: guest.qrToken ?? null });
});
