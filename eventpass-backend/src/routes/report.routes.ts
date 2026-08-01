import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router({ mergeParams: true });
router.use(authenticate, requireRole('organizer', 'super_admin'));

router.get('/attendance', ctrl.attendanceReport);
router.get('/attendance/export', ctrl.exportAttendanceReport);
router.get('/rsvp', ctrl.rsvpReport);
router.get('/rsvp/export', ctrl.exportRsvpReport);

export default router;
