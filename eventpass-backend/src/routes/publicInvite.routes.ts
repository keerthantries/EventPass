import { Router } from 'express';
import * as ctrl from '../controllers/publicInvite.controller';
import { validate } from '../middleware/validate';
import { publicInviteLimiter } from '../middleware/rateLimiters';
import { submitRsvpSchema, submitFormResponseSchema } from '../validators/formValidators';

const router = Router();
router.use(publicInviteLimiter);

router.get('/:token', ctrl.getInvitation);
router.post('/:token/rsvp', validate(submitRsvpSchema), ctrl.submitRsvp);
router.post('/:token/form', validate(submitFormResponseSchema), ctrl.submitFormResponse);

export default router;
