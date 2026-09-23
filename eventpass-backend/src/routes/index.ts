import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import { nestedCategoryRoutes, flatCategoryRoutes } from './category.routes';
import { nestedGuestRoutes, flatGuestRoutes } from './guest.routes';
import { nestedPartyRoutes } from './party.routes';
import formRoutes from './form.routes';
import publicInviteRoutes from './publicInvite.routes';
import publicFamilyRoutes from './publicFamily.routes';
import checkinRoutes, { nestedCheckinRoutes } from './checkin.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);

// Event-scoped resources
router.use('/events/:eventId/categories', nestedCategoryRoutes);
router.use('/events/:eventId/guests', nestedGuestRoutes);
router.use('/events/:eventId/parties', nestedPartyRoutes);
router.use('/events/:eventId/form', formRoutes);
router.use('/events/:eventId/checkin', nestedCheckinRoutes);
router.use('/events/:eventId/dashboard', dashboardRoutes);
router.use('/events/:eventId/reports', reportRoutes);

// Flat resources
router.use('/categories', flatCategoryRoutes);
router.use('/guests', flatGuestRoutes);
router.use('/checkin', checkinRoutes);

// Public, token-based, no JWT
router.use('/public/invite', publicInviteRoutes);
router.use('/public/family', publicFamilyRoutes);

export default router;
