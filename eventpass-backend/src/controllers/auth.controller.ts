import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

/** POST /auth/register — self-registration always creates an 'organizer' (super_admin is seeded manually). */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const hash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({ name, email, password: hash, role: 'organizer' });

  return sendSuccess(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 201);
});

/** POST /auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid email or password.');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized('Invalid email or password.');

  const token = signAccessToken({ sub: user.id, role: user.role, organizerId: user.organizerId?.toString() ?? null });
  const refreshToken = signRefreshToken({ sub: user.id });

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);

  return sendSuccess(res, {
    token,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role },
  });
});

/** POST /auth/refresh — reads refresh token from httpOnly cookie, rotates it. */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.cookies?.[REFRESH_COOKIE];
  if (!incoming) throw ApiError.unauthorized('No refresh token provided.');

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(incoming);
  } catch {
    throw ApiError.unauthorized('Refresh token expired or invalid.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized();

  const newAccessToken = signAccessToken({ sub: user.id, role: user.role, organizerId: user.organizerId?.toString() ?? null });
  const newRefreshToken = signRefreshToken({ sub: user.id });
  res.cookie(REFRESH_COOKIE, newRefreshToken, REFRESH_COOKIE_OPTS);

  return sendSuccess(res, { token: newAccessToken });
});

/** GET /auth/me */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) throw ApiError.unauthorized();
  return sendSuccess(res, { id: user.id, name: user.name, email: user.email, role: user.role });
});

/** POST /auth/logout */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE);
  return sendSuccess(res, { loggedOut: true });
});

/** POST /auth/security-staff — organizer-only provisioning of Security accounts (API §1.5). */
export const createSecurityStaff = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const organizerId = req.user!.sub;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const hash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const staff = await User.create({ name, email, password: hash, role: 'security', organizerId });

  return sendSuccess(res, { id: staff.id, name: staff.name, role: staff.role, organizerId }, 201);
});

/** GET /auth/security-staff — organizer lists their own Security accounts. */
export const listSecurityStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await User.find({ role: 'security', organizerId: req.user!.sub });
  return sendSuccess(res, staff.map((s) => ({ id: s.id, name: s.name, email: s.email, isActive: s.isActive })));
});

/** DELETE /auth/security-staff/:id — deactivate, not hard-delete (preserves CheckinLog.scannedBy history). */
export const deactivateSecurityStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await User.findOne({ _id: req.params.id, role: 'security', organizerId: req.user!.sub });
  if (!staff) throw ApiError.notFound('Security staff account not found.');
  staff.isActive = false;
  await staff.save();
  return sendSuccess(res, { id: staff.id, isActive: false });
});
