import { Router } from 'express';
import * as ctrl from '../controllers/form.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { putFormSchema } from '../validators/formValidators';

const router = Router({ mergeParams: true });
router.use(authenticate, requireRole('organizer', 'super_admin'));

router.get('/', ctrl.getForm);
router.put('/', validate(putFormSchema), ctrl.putForm);
router.get('/responses', ctrl.listFormResponses);
router.get('/responses/export', ctrl.exportFormResponses);

export default router;
