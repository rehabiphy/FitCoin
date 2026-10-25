import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down', time: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
