import { Router } from 'express';
import * as ctrl from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidators';

// Mounted twice: nested under /events/:eventId/categories and flat /categories/:id
const nested = Router({ mergeParams: true });
nested.use(authenticate, requireRole('organizer', 'super_admin', 'security'));
nested.get('/', ctrl.listCategories);
nested.post('/', requireRole('organizer', 'super_admin'), validate(createCategorySchema), ctrl.createCategory);

const flat = Router();
flat.use(authenticate, requireRole('organizer', 'super_admin'));
flat.patch('/:id', validate(updateCategorySchema), ctrl.updateCategory);
flat.delete('/:id', ctrl.deleteCategory);

export { nested as nestedCategoryRoutes, flat as flatCategoryRoutes };
