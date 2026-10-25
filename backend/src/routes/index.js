import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import stepsRoutes from './steps.routes.js';
import walletRoutes from './wallet.routes.js';
import activityRoutes from './activity.routes.js';
import challengeRoutes from './challenge.routes.js';
import marketplaceRoutes from './marketplace.routes.js';
import notificationRoutes from './notification.routes.js';
import communityRoutes from './community.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down', time: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/steps', stepsRoutes);
router.use('/wallet', walletRoutes);
router.use('/activities', activityRoutes);
router.use('/challenges', challengeRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', communityRoutes);

export default router;
