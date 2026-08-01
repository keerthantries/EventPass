import { Router } from 'express';
import * as ctrl from '../controllers/checkin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { scanLimiter } from '../middleware/rateLimiters';
import { scanSchema, searchQuerySchema } from '../validators/checkinValidators';

const router = Router();
router.use(authenticate, requireRole('organizer', 'super_admin', 'security'));

router.post('/scan', scanLimiter, validate(scanSchema), ctrl.scanCheckin);
router.post('/manual/:guestId', scanLimiter, ctrl.manualCheckin);

export default router;

// Event-scoped search/recent endpoints (mounted separately under /events/:eventId/checkin)
export const nestedCheckinRoutes = Router({ mergeParams: true });
nestedCheckinRoutes.use(authenticate, requireRole('organizer', 'super_admin', 'security'));
nestedCheckinRoutes.get('/search', validate(searchQuerySchema, 'query'), ctrl.searchCheckin);
nestedCheckinRoutes.get('/recent', ctrl.recentCheckins);
