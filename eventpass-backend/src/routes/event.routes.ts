import { Router } from 'express';
import * as ctrl from '../controllers/event.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import {
  createEventSchema,
  updateEventSchema,
  updateEventConfigSchema,
  updateBrandingSchema,
  listEventsQuerySchema,
} from '../validators/eventValidators';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('organizer', 'super_admin', 'security'), validate(listEventsQuerySchema, 'query'), ctrl.listEvents);
router.post('/', requireRole('organizer', 'super_admin'), validate(createEventSchema), ctrl.createEvent);
router.get('/:id', requireRole('organizer', 'super_admin', 'security'), ctrl.getEvent);
router.patch('/:id', requireRole('organizer', 'super_admin'), validate(updateEventSchema), ctrl.updateEvent);
router.delete('/:id', requireRole('organizer', 'super_admin'), ctrl.archiveEvent);
router.patch('/:id/config', requireRole('organizer', 'super_admin'), validate(updateEventConfigSchema), ctrl.updateEventConfig);
router.patch('/:id/branding', requireRole('organizer', 'super_admin'), validate(updateBrandingSchema), ctrl.updateBranding);

export default router;
