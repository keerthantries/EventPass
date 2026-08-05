import { Request, Response } from 'express';
import { Event } from '../models/Event';
import { EventConfig, IEventConfig, WorkflowKey } from '../models/EventConfig';
import { Guest } from '../models/Guest';
import { Category } from '../models/Category';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { parsePagination, buildMeta } from '../utils/pagination';
import { writeAuditLog } from '../models/AuditLog';

/**
 * Returns the Event-scoping filter for the current user (API spec §1.2):
 *  - super_admin: sees every event
 *  - organizer:   sees only events they own (their own user id)
 *  - security:    sees events owned by their organizer (req.user.organizerId)
 */
export function eventScopeFilter(req: Request): Record<string, unknown> {
  const role = req.user!.role;
  if (role === 'super_admin') return {};
  if (role === 'security') return { organizerId: req.user!.organizerId };
  return { organizerId: req.user!.sub };
}

/** Resolves an event the current user may access, else 404/403. */
async function getOwnedEvent(eventId: string, req: Request) {
  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found.');
  const ownerId = req.user!.role === 'security' ? req.user!.organizerId : req.user!.sub;
  if (req.user!.role !== 'super_admin' && event.organizerId.toString() !== ownerId) {
    throw ApiError.forbidden('This event does not belong to you.');
  }
  return event;
}

/** Defaults applied to a freshly created EventConfig (mirrors the Mongoose schema). */
const DEFAULT_MODULES: IEventConfig['modules'] = {
  invitation: true,
  rsvp: false,
  dynamicForm: false,
  qrCheckin: true,
  csvImport: true,
  reports: true,
};

/** Modules that must be enabled for a given workflow (workflow-vs-module consistency guard). */
const WORKFLOW_REQUIRES: Partial<Record<WorkflowKey, { rsvp?: boolean; dynamicForm?: boolean }>> = {
  invite_rsvp: { rsvp: true },
  invite_rsvp_form_qr: { rsvp: true, dynamicForm: true },
  invite_form_approval_qr: { dynamicForm: true },
};

/**
 * Guards that the resulting config never references a module that is being
 * disabled in the same request, e.g. switching to "Invite → RSVP → form → QR"
 * while the Dynamic Form module is off.
 */
function assertWorkflowModuleConsistency(base: Partial<IEventConfig>, patch: Partial<IEventConfig>) {
  const nextModules: IEventConfig['modules'] = { ...DEFAULT_MODULES, ...base.modules, ...patch.modules };
  const nextWorkflow = (patch.workflow ?? base.workflow ?? 'add_qr_checkin') as WorkflowKey;
  const needs = WORKFLOW_REQUIRES[nextWorkflow];
  if (!needs) return;

  if (needs.rsvp && !nextModules.rsvp) {
    throw ApiError.moduleDisabled(`Workflow "${nextWorkflow}" requires the RSVP module to be enabled.`);
  }
  if (needs.dynamicForm && !nextModules.dynamicForm) {
    throw ApiError.moduleDisabled(`Workflow "${nextWorkflow}" requires the Dynamic Form module to be enabled.`);
  }
}

/**
 * Pre-populates sensible default categories when an event is created, so the
 * organizer has a useful starting point instead of a blank "categories" tab.
 * Wedding/marriage events get guest-group specific categories; every other
 * type gets generic ones. Categories stay fully editable/deletable.
 */
function weddingKeywords(eventType?: string) {
  const t = (eventType ?? '').toLowerCase();
  return /wed|marri|bride|groom|shaadi|ceremony|nuptial/.test(t);
}

async function seedDefaultCategories(event: any) {
  const defaults = weddingKeywords(event.type)
    ? [
        { name: "Bride's Guests", colorTag: '#EC4899' },
        { name: "Groom's Guests", colorTag: '#8B5CF6' },
        { name: 'Family', colorTag: '#F59E0B' },
        { name: 'Friends', colorTag: '#10B981' },
        { name: 'VIP', colorTag: '#3B82F6' },
      ]
    : [
        { name: 'VIP', colorTag: '#3B82F6' },
        { name: 'Staff', colorTag: '#8B5CF6' },
        { name: 'Guests', colorTag: '#10B981' },
      ];

  await Category.insertMany(defaults.map((c) => ({ eventId: event._id, ...c })));
}

/** GET /events */
export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query, 100);
  const { status, type, q, sort } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = eventScopeFilter(req);
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (q) filter.$text = { $search: q };

  let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort) {
    const dir = sort.startsWith('-') ? -1 : 1;
    const field = sort.replace(/^-/, '');
    sortSpec = { [field]: dir };
  }

  const [events, total] = await Promise.all([
    Event.find(filter).sort(sortSpec).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  const guestCounts = await Guest.aggregate([
    { $match: { eventId: { $in: events.map((e) => e._id) } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(guestCounts.map((g) => [g._id.toString(), g.count]));

  const data = events.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    status: e.status,
    startDate: e.startDate,
    guestCount: countMap.get(e.id) ?? 0,
  }));

  return sendSuccess(res, data, 200, buildMeta(page, limit, total));
});

/** POST /events — creates an event plus its EventConfig (workflow/modules can be supplied up front). */
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { config: configInput, ...eventFields } = req.body;

  assertWorkflowModuleConsistency({}, configInput ?? {});

  const event = await Event.create({ ...eventFields, organizerId: req.user!.sub });
  const config = await EventConfig.create({ eventId: event._id, ...configInput });

  await seedDefaultCategories(event);

  await writeAuditLog(req.user!.sub, 'event.create', 'Event', event.id, { status: event.status, workflow: config.workflow });

  return sendSuccess(res, { id: event.id, ...event.toObject(), config }, 201);
});

/** GET /events/:id */
export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.id, req);
  const config = await EventConfig.findOne({ eventId: event._id });

  const [totalGuests, present, rsvpAccepted] = await Promise.all([
    Guest.countDocuments({ eventId: event._id }),
    Guest.countDocuments({ eventId: event._id, attendanceStatus: 'present' }),
    Guest.countDocuments({ eventId: event._id, rsvpStatus: 'accepted' }),
  ]);

  return sendSuccess(res, {
    id: event.id,
    ...event.toObject(),
    config,
    stats: { totalGuests, present, rsvpAccepted },
  });
});

/** PATCH /events/:id */
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.id, req);
  Object.assign(event, req.body);
  await event.save();
  await writeAuditLog(req.user!.sub, 'event.update', 'Event', event.id, req.body);
  return sendSuccess(res, { id: event.id, ...event.toObject() });
});

/** DELETE /events/:id — soft delete only (archive). No hard delete is exposed (DB design §2.5). */
export const archiveEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.id, req);
  event.status = 'archived';
  await event.save();
  await writeAuditLog(req.user!.sub, 'event.archive', 'Event', event.id);
  return sendSuccess(res, { id: event.id, status: event.status });
});

/** PATCH /events/:id/config */
export const updateEventConfig = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.id, req);
  const config = await EventConfig.findOne({ eventId: event._id });
  if (!config) throw ApiError.notFound('Event config not found.');

  // Guard: workflow can't reference a module that's being disabled in the same request.
  assertWorkflowModuleConsistency(config.toObject(), req.body);

  Object.assign(config, req.body);
  await config.save();
  await writeAuditLog(req.user!.sub, 'event.config.update', 'Event', event.id, req.body);
  return sendSuccess(res, config);
});

/** PATCH /events/:id/branding */
export const updateBranding = asyncHandler(async (req: Request, res: Response) => {
  const event = await getOwnedEvent(req.params.id, req);
  const { logo, coverImage, primaryColor, secondaryColor } = req.body;
  if (logo !== undefined) event.logo = logo;
  if (coverImage !== undefined) event.coverImage = coverImage;
  event.branding = {
    primaryColor: primaryColor ?? event.branding?.primaryColor,
    secondaryColor: secondaryColor ?? event.branding?.secondaryColor,
  };
  await event.save();
  return sendSuccess(res, { logo: event.logo, coverImage: event.coverImage, branding: event.branding });
});

export { getOwnedEvent };
