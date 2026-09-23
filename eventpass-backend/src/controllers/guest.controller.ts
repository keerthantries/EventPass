import { Request, Response } from 'express';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver: (format: 'zip', options?: Record<string, unknown>) => any = require('archiver');
import ExcelJS from 'exceljs';
import { Guest } from '../models/Guest';
import { Party } from '../models/Party';
import { Category } from '../models/Category';
import { EventConfig } from '../models/EventConfig';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { parsePagination, buildMeta } from '../utils/pagination';
import { generateInvitationToken, generateQrToken, generatePartyToken } from '../utils/tokens';
import { generateQrImage, qrFilePath } from '../utils/qr';
import { parseGuestFile } from '../utils/csv';
import { getOwnedEvent } from './event.controller';
import { writeAuditLog } from '../models/AuditLog';

/** GET /events/:eventId/guests */
export const listGuests = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { page, limit, skip } = parsePagination(req.query, 200);
  const {
    rsvpStatus, attendanceStatus, category, q, sort,
    side, isVip, isImmediateFamily, partyId, invitationStatus,
  } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = { eventId: event._id };
  if (rsvpStatus) filter.rsvpStatus = rsvpStatus;
  if (attendanceStatus) filter.attendanceStatus = attendanceStatus;
  if (category) filter.categoryId = category;
  if (side) filter.side = side;
  if (isVip === 'true') filter.isVip = true;
  if (isVip === 'false') filter.isVip = false;
  if (isImmediateFamily === 'true') filter.isImmediateFamily = true;
  if (isImmediateFamily === 'false') filter.isImmediateFamily = false;
  if (partyId) filter.partyId = partyId;
  if (invitationStatus) filter.invitationStatus = invitationStatus;
  if (q) filter.$text = { $search: q };

  let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort) {
    const dir = sort.startsWith('-') ? -1 : 1;
    sortSpec = { [sort.replace(/^-/, '')]: dir };
  }

  const [guests, total] = await Promise.all([
    Guest.find(filter).sort(sortSpec).skip(skip).limit(limit).populate('partyId', 'name side'),
    Guest.countDocuments(filter),
  ]);

  const projected = res.locals.projectGuests(guests.map((g) => {
    const obj: Record<string, any> = g.toObject();
    if (obj.partyId && typeof obj.partyId === 'object') {
      obj.partyName = obj.partyId.name;
      obj.side = obj.side ?? obj.partyId.side;
      obj.partyId = obj.partyId._id;
    }
    return obj;
  }));
  return sendSuccess(res, projected, 200, buildMeta(page, limit, total));
});

/** POST /events/:eventId/guests */
export const createGuest = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const {
    fullName, firstName, lastName, email, phone, category, notes,
    partyId, side, isVip, isImmediateFamily,
  } = req.body;

  if (category) {
    const cat = await Category.findOne({ _id: category, eventId: event._id });
    if (!cat) throw ApiError.badRequest('Category does not exist for this event.');
  }

  if (partyId) {
    const party = await Party.findOne({ _id: partyId, eventId: event._id });
    if (!party) throw ApiError.badRequest('Party does not exist for this event.');
  }

  const computedFullName = fullName ?? [firstName, lastName].filter(Boolean).join(' ');
  if (!computedFullName || computedFullName.length < 2) {
    throw ApiError.badRequest('fullName or firstName is required.');
  }

  const guest = await Guest.create({
    eventId: event._id,
    categoryId: category ?? null,
    partyId: partyId ?? null,
    fullName: computedFullName,
    firstName,
    lastName,
    email,
    phone,
    notes,
    side,
    isVip: isVip ?? false,
    isImmediateFamily: isImmediateFamily ?? false,
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
  const { guestIds, action, categoryId, side, isVip, isImmediateFamily, partyId } = req.body;

  if (action === 'reassignCategory') {
    if (!categoryId) throw ApiError.badRequest('categoryId is required for reassignCategory.');
    const category = await Category.findOne({ _id: categoryId, eventId: event._id });
    if (!category) throw ApiError.notFound('Category not found for this event.');
    const result = await Guest.updateMany({ _id: { $in: guestIds }, eventId: event._id }, { categoryId });
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  if (action === 'delete') {
    const { FormResponse } = await import('../models/FormResponse');
    const guests = await Guest.find({ _id: { $in: guestIds }, eventId: event._id });
    const guestIdsToDelete = guests.map((g) => g._id);
    await FormResponse.deleteMany({ guestId: { $in: guestIdsToDelete } });
    const result = await Guest.deleteMany({ _id: { $in: guestIds }, eventId: event._id });
    return sendSuccess(res, { updated: result.deletedCount });
  }

  if (action === 'setSide') {
    const result = await Guest.updateMany({ _id: { $in: guestIds }, eventId: event._id }, { side });
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  if (action === 'setVip') {
    const result = await Guest.updateMany({ _id: { $in: guestIds }, eventId: event._id }, { isVip: isVip ?? false });
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  if (action === 'setImmediateFamily') {
    const result = await Guest.updateMany(
      { _id: { $in: guestIds }, eventId: event._id },
      { isImmediateFamily: isImmediateFamily ?? false }
    );
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  if (action === 'assignParty') {
    if (!partyId) throw ApiError.badRequest('partyId is required for assignParty.');
    const party = await Party.findOne({ _id: partyId, eventId: event._id });
    if (!party) throw ApiError.notFound('Party not found for this event.');
    const result = await Guest.updateMany({ _id: { $in: guestIds }, eventId: event._id }, { partyId });
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  if (action === 'generateBulkQr') {
    const guests = await Guest.find({ _id: { $in: guestIds }, eventId: event._id, qrToken: null });
    let generated = 0;
    for (const guest of guests) {
      guest.qrToken = generateQrToken();
      guest.qrGeneratedAt = new Date();
      await guest.save();
      await generateQrImage(guest.qrToken);
      generated++;
    }
    return sendSuccess(res, { generated });
  }

  if (action === 'markSent') {
    const channel = ['email', 'sms', 'whatsapp', 'other'].includes(req.body.channel) ? req.body.channel : undefined;
    const update: Record<string, unknown> = { invitationStatus: 'sent', invitationSentAt: new Date() };
    if (channel) update.invitationChannel = channel;
    const result = await Guest.updateMany(
      { _id: { $in: guestIds }, eventId: event._id },
      update
    );
    return sendSuccess(res, { updated: result.modifiedCount });
  }

  throw ApiError.badRequest('Unsupported bulk action.');
});

/** POST /events/:eventId/guests/import */
export const importGuests = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);

  if (!req.file) throw ApiError.badRequest('A file is required (multipart field name: file).');
  if (req.file.size > 5 * 1024 * 1024) throw ApiError.badRequest('File exceeds the 5MB limit.');
  if (req.file.mimetype === 'text/html' || !/\.(csv|xlsx|xls)$/i.test(req.file.originalname)) {
    throw ApiError.badRequest('Unsupported file type. Upload a CSV or Excel (.xlsx) file.');
  }

  const rows = await parseGuestFile(req.file.buffer, req.file.originalname);
  if (rows.length > 5000) throw ApiError.badRequest('File exceeds the 5,000 row limit.');

  const [config, existingGuests] = await Promise.all([
    EventConfig.findOne({ eventId: event._id }),
    Guest.find({ eventId: event._id }).select('fullName').lean(),
  ]);
  const existingNames = new Set(existingGuests.map((g) => g.fullName.toLowerCase().trim()));

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

  const partyCache = new Map<string, string>();
  async function resolveParty(name?: string, side?: string, externalId?: string): Promise<string | null> {
    if (!name && !externalId) return null;
    const ext = externalId?.trim() || undefined;
    const nameKey = name?.trim().toLowerCase();
    const key = ext ? `ext:${ext.toLowerCase()}` : `name:${nameKey!}`;
    if (partyCache.has(key)) return partyCache.get(key)!;

    let party = ext
      ? await Party.findOne({ eventId: event._id, externalId: ext })
      : name
        ? await Party.findOne({ eventId: event._id, name: new RegExp(`^${name.trim()}$`, 'i') })
        : null;

    if (!party) {
      party = await Party.create({
        eventId: event._id,
        name: name?.trim() || ext!,
        side,
        token: generatePartyToken(),
        externalId: ext,
      });
    } else if (ext && !party.externalId) {
      party.externalId = ext;
      await party.save();
    }

    partyCache.set(key, party.id);
    if (nameKey) partyCache.set(`name:${nameKey}`, party.id);
    if (ext) partyCache.set(`ext:${ext.toLowerCase()}`, party.id);
    return party.id;
  }

  const generateQr = config?.qrGenerationTiming === 'on_add';

  let imported = 0;
  let skippedDuplicates = 0;
  const errors: { row: number; reason: string }[] = [];

  for (const row of rows) {
    const computedFullName = row.fullName ?? [row.firstName, row.lastName].filter(Boolean).join(' ');
    if (!computedFullName) {
      errors.push({ row: row.row, reason: 'fullName or firstName is required' });
      continue;
    }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: row.row, reason: 'invalid email format' });
      continue;
    }

    const nameKey = computedFullName.toLowerCase().trim();
    if (existingNames.has(nameKey)) {
      skippedDuplicates += 1;
      continue;
    }

    const categoryId = await resolveCategory(row.category);
    const partyId = await resolveParty(row.partyName, row.side, row.partyId);

    const guestData: Record<string, any> = {
      eventId: event._id,
      fullName: computedFullName,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      notes: row.notes,
      categoryId,
      partyId,
      side: row.side,
      isVip: row.isVip ?? false,
      isImmediateFamily: row.isImmediateFamily ?? false,
      invitationToken: generateInvitationToken(),
    };

    if (generateQr) {
      guestData.qrToken = generateQrToken();
      guestData.qrGeneratedAt = new Date();
    }

    const guest = await Guest.create(guestData);

    if (generateQr && guest.qrToken) {
      await generateQrImage(guest.qrToken);
    }

    existingNames.add(nameKey);
    imported += 1;
  }

  await writeAuditLog(req.user!.sub, 'guest.import', 'Event', event.id, { imported, skippedDuplicates, failed: errors.length });

  return sendSuccess(res, { totalRows: rows.length, imported, skippedDuplicates, failed: errors.length, errors });
});

/** GET /events/:eventId/guests/export */
export const exportGuests = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';
  const guests = await Guest.find({ eventId: event._id })
    .populate('categoryId', 'name')
    .populate('partyId', 'name side');

  const rows = guests.map((g: any) => ({
    firstName: g.firstName ?? '',
    lastName: g.lastName ?? '',
    fullName: g.fullName,
    email: g.email ?? '',
    phone: g.phone ?? '',
    category: g.categoryId?.name ?? '',
    party: g.partyId?.name ?? '',
    side: g.side ?? '',
    vip: g.isVip ? 'Yes' : '',
    immediateFamily: g.isImmediateFamily ? 'Yes' : '',
    invitationStatus: g.invitationStatus,
    invitationChannel: g.invitationChannel ?? '',
    invitationSentAt: g.invitationSentAt ?? '',
    invitationOpenedAt: g.invitationOpenedAt ?? '',
    rsvpStatus: g.rsvpStatus,
    attendanceStatus: g.attendanceStatus,
    checkInTime: g.checkInTime ?? '',
    notes: g.notes ?? '',
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
  const guest = await Guest.findById(req.params.id).populate('partyId', 'name side');
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);
  const obj: Record<string, any> = guest.toObject();
  if (obj.partyId && typeof obj.partyId === 'object') {
    obj.partyName = obj.partyId.name;
    obj.side = obj.side ?? obj.partyId.side;
    obj.partyId = obj.partyId._id;
  }
  return sendSuccess(res, res.locals.projectGuest(obj));
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

  if (req.body.partyId !== undefined) {
    if (req.body.partyId) {
      const party = await Party.findOne({ _id: req.body.partyId, eventId: guest.eventId });
      if (!party) throw ApiError.badRequest('Party does not exist for this event.');
    }
    guest.partyId = req.body.partyId || null;
    delete req.body.partyId;
  }

  if (req.body.fullName === undefined && req.body.firstName !== undefined) {
    req.body.fullName = [req.body.firstName, req.body.lastName ?? guest.lastName].filter(Boolean).join(' ');
  }

  Object.assign(guest, req.body);
  await guest.save();
  return sendSuccess(res, res.locals.projectGuest(guest.toObject()));
});

/** DELETE /guests/:id */
export const deleteGuest = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);

  const { FormResponse } = await import('../models/FormResponse');
  await FormResponse.deleteOne({ guestId: guest._id });
  await guest.deleteOne();

  return sendSuccess(res, { id: req.params.id, deleted: true });
});

/** POST /guests/:id/qr */
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

/** GET /events/:eventId/guests/qr/download-all */
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

/** POST /guests/:id/mark-sent */
export const markGuestSent = asyncHandler(async (req: Request, res: Response) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found.');
  await getOwnedEvent(guest.eventId.toString(), req);

  guest.invitationStatus = 'sent';
  guest.invitationSentAt = new Date();
  const channel = req.body?.channel;
  if (['email', 'sms', 'whatsapp', 'other'].includes(channel)) {
    guest.invitationChannel = channel;
  }
  await guest.save();

  return sendSuccess(res, res.locals.projectGuest(guest.toObject()));
});

/** POST /guests/:id/approve */
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
