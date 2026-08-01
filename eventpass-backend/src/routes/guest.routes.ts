import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/guest.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { attachGuestProjection } from '../middleware/guestFieldProjection';
import {
  createGuestSchema,
  updateGuestSchema,
  bulkGuestActionSchema,
  approveGuestSchema,
  listGuestsQuerySchema,
} from '../validators/guestValidators';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Nested under /events/:eventId/guests
const nested = Router({ mergeParams: true });
nested.use(authenticate, attachGuestProjection);
nested.get('/', requireRole('organizer', 'super_admin', 'security'), validate(listGuestsQuerySchema, 'query'), ctrl.listGuests);
nested.post('/', requireRole('organizer', 'super_admin'), validate(createGuestSchema), ctrl.createGuest);
nested.patch('/bulk', requireRole('organizer', 'super_admin'), validate(bulkGuestActionSchema), ctrl.bulkGuestAction);
nested.post('/import', requireRole('organizer', 'super_admin'), upload.single('file'), ctrl.importGuests);
nested.get('/export', requireRole('organizer', 'super_admin'), ctrl.exportGuests);
nested.get('/qr/download-all', requireRole('organizer', 'super_admin'), ctrl.downloadAllQr);

// Flat /guests/:id
const flat = Router();
flat.use(authenticate, attachGuestProjection);
flat.get('/:id', requireRole('organizer', 'super_admin', 'security'), ctrl.getGuest);
flat.patch('/:id', requireRole('organizer', 'super_admin'), validate(updateGuestSchema), ctrl.updateGuest);
flat.delete('/:id', requireRole('organizer', 'super_admin'), ctrl.deleteGuest);
flat.post('/:id/qr', requireRole('organizer', 'super_admin'), ctrl.generateGuestQr);
flat.get('/:id/qr/download', requireRole('organizer', 'super_admin'), ctrl.downloadGuestQr);
flat.post('/:id/approve', requireRole('organizer', 'super_admin'), validate(approveGuestSchema), ctrl.approveGuest);

export { nested as nestedGuestRoutes, flat as flatGuestRoutes };
