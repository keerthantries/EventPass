import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { Guest } from '../models/Guest';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { getOwnedEvent } from './event.controller';

/** GET /events/:eventId/categories */
export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);
  const categories = await Category.find({ eventId: event._id }).sort({ name: 1 });

  const counts = await Guest.aggregate([
    { $match: { eventId: event._id, categoryId: { $ne: null } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return sendSuccess(
    res,
    categories.map((c) => ({ _id: c.id, id: c.id, name: c.name, colorTag: c.colorTag, guestCount: countMap.get(c.id) ?? 0 }))
  );
});

/** POST /events/:eventId/categories */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.eventId, req);

  const existing = await Category.findOne({ eventId: event._id, name: new RegExp(`^${req.body.name}$`, 'i') });
  if (existing) throw ApiError.conflict('A category with this name already exists for this event.');

  const category = await Category.create({ eventId: event._id, ...req.body });
  return sendSuccess(res, { _id: category.id, id: category.id, name: category.name, colorTag: category.colorTag }, 201);
});

/** PATCH /categories/:id */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');
  await getOwnedEvent(category.eventId.toString(), req); // ownership check via parent event

  Object.assign(category, req.body);
  await category.save();
  return sendSuccess(res, category);
});

/** DELETE /categories/:id — blocked if any guest still references it (DB design §2.5). */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');
  await getOwnedEvent(category.eventId.toString(), req);

  const guestCount = await Guest.countDocuments({ categoryId: category._id });
  if (guestCount > 0) {
    throw ApiError.conflict('Cannot delete category with guests assigned.', [{ guestCount }]);
  }

  await category.deleteOne();
  return sendSuccess(res, { id: category.id, deleted: true });
});
