import { Router } from 'express';
import * as ctrl from '../controllers/party.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

// Nested under /events/:eventId/parties
const nested = Router({ mergeParams: true });
nested.use(authenticate);
nested.get('/', requireRole('organizer', 'super_admin'), ctrl.listParties);

export { nested as nestedPartyRoutes };
