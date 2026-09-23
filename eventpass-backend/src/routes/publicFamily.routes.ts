import { Router } from 'express';
import { getFamily } from '../controllers/publicFamily.controller';
import { publicInviteLimiter } from '../middleware/rateLimiters';

const router = Router();

router.get('/:token', publicInviteLimiter, getFamily);

export default router;
