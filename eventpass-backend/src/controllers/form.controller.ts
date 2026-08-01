import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { FormSchema } from '../models/FormSchema';
import { FormResponse } from '../models/FormResponse';
import { EventConfig } from '../models/EventConfig';
import { Guest } from '../models/Guest';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { parsePagination, buildMeta } from '../utils/pagination';
import { getOwnedEvent } from './event.controller';

/** GET /events/:eventId/form */
export const getForm = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const schema = await FormSchema.findOne({ eventId: event._id });
  return sendSuccess(res, { eventId: event.id, fields: schema?.fields ?? [] });
});

/** PUT /events/:eventId/form — full replace (API spec §1.5). */
export const putForm = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const config = await EventConfig.findOne({ eventId: event._id });
  if (!config?.modules.dynamicForm) throw ApiError.moduleDisabled('Dynamic Form module is disabled for this event.');

  const schema = await FormSchema.findOneAndUpdate(
    { eventId: event._id },
    { eventId: event._id, fields: req.body.fields },
    { upsert: true, new: true }
  );
  return sendSuccess(res, schema);
});

/** GET /events/:eventId/form/responses */
export const listFormResponses = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const { page, limit, skip } = parsePagination(req.query, 100);

  const [responses, total] = await Promise.all([
    FormResponse.find({ eventId: event._id }).populate('guestId', 'fullName').skip(skip).limit(limit),
    FormResponse.countDocuments({ eventId: event._id }),
  ]);

  const data = responses.map((r: any) => ({
    guestId: r.guestId._id,
    guestName: r.guestId.fullName,
    answers: Object.fromEntries(r.answers),
    submittedAt: r.createdAt,
  }));

  return sendSuccess(res, data, 200, buildMeta(page, limit, total));
});

/** GET /events/:eventId/form/responses/export — CSV/XLSX of form responses, capped at 20,000 rows. */
export const exportFormResponses = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';

  const schema = await FormSchema.findOne({ eventId: event._id });
  const fields = schema?.fields ?? [];

  const responses = await FormResponse.find({ eventId: event._id })
    .limit(20000)
    .populate('guestId', 'fullName');

  const rows = responses.map((r: any) => {
    const answers = Object.fromEntries(r.answers);
    const row: Record<string, unknown> = { guestName: r.guestId?.fullName ?? '' };
    for (const field of fields) row[field.label] = answers[field.key] ?? '';
    return row;
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Form Responses');
  sheet.columns = Object.keys(rows[0] ?? { guestName: '' }).map((key) => ({ header: key, key }));
  sheet.addRows(rows);

  if (format === 'xlsx') {
    res.setHeader('Content-Disposition', `attachment; filename="form-responses-${event.id}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    return res.end();
  }

  res.setHeader('Content-Disposition', `attachment; filename="form-responses-${event.id}.csv"`);
  res.setHeader('Content-Type', 'text/csv');
  return res.send(await workbook.csv.writeBuffer());
});
