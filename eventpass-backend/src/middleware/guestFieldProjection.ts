import { Request, Response, NextFunction } from 'express';

/**
 * Field-level access control for the Guest resource (API spec §1.3).
 * Security role never receives email/phone/notes/invitationToken/form answers,
 * regardless of what the query/controller fetched. Attach as res.locals.projectGuest
 * and call it right before sending any guest object/array.
 */
const SECURITY_HIDDEN_FIELDS = ['email', 'phone', 'notes', 'invitationToken'];

export function attachGuestProjection(req: Request, res: Response, next: NextFunction) {
  res.locals.projectGuest = (guest: Record<string, any>) => {
    if (req.user?.role !== 'security') return guest;
    const clone = { ...guest };
    for (const field of SECURITY_HIDDEN_FIELDS) delete clone[field];
    return clone;
  };
  res.locals.projectGuests = (guests: Record<string, any>[]) => guests.map((g) => res.locals.projectGuest(g));
  next();
}
