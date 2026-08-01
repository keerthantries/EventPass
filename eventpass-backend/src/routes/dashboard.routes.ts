import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router({ mergeParams: true });
router.use(authenticate, requireRole('organizer', 'super_admin'));
router.get('/', ctrl.getDashboard);

export default router;
