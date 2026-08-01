import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { loginLimiter } from '../middleware/rateLimiters';
import { registerSchema, loginSchema, createSecurityStaffSchema } from '../validators/authValidators';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', loginLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.get('/me', authenticate, ctrl.me);
router.post('/logout', ctrl.logout);

router.post(
  '/security-staff',
  authenticate,
  requireRole('organizer'),
  validate(createSecurityStaffSchema),
  ctrl.createSecurityStaff
);
router.get('/security-staff', authenticate, requireRole('organizer'), ctrl.listSecurityStaff);
router.delete('/security-staff/:id', authenticate, requireRole('organizer'), ctrl.deactivateSecurityStaff);

export default router;
