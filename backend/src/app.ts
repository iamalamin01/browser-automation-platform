import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import testUserRoutes from './routes/testUsers';
import scenarioRoutes from './routes/scenarios';
import taskRoutes from './routes/tasks';
import reportRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';

const app = express();

// ─── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Static Files (screenshots) ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Public Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Protected Routes ──────────────────────────────────────────────────────────
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/profiles', authMiddleware, profileRoutes);
app.use('/api/test-users', authMiddleware, testUserRoutes);
app.use('/api/scenarios', authMiddleware, scenarioRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
