import { Request, Response } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { parsePagination, buildMeta } from '../utils/pagination';

/** GET /users — super_admin lists all accounts (organizers, security, admins). */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'super_admin') throw ApiError.forbidden('Admin access required.');

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, 100);
  const role = typeof req.query.role === 'string' && req.query.role ? req.query.role : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const filter: Record<string, unknown> = {};
  if (role === 'super_admin' || role === 'organizer' || role === 'security') filter.role = role;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('organizerId', 'name email')
      .lean(),
  ]);

  const items = users.map((u) => {
    const organizer = u.organizerId as { _id: unknown; name?: string; email?: string } | null;
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      organizerId: organizer ? String(organizer._id) : null,
      organizerName: organizer?.name ?? null,
      organizerEmail: organizer?.email ?? null,
      createdAt: u.createdAt,
    };
  });

  return sendSuccess(res, items, 200, buildMeta(page, limit, total));
});
