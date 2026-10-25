import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import env from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

// Strips `$` / `.` operator keys from query filters to block NoSQL injection
mongoose.set('sanitizeFilter', true);

const app = express();

app.disable('x-powered-by');
// Set TRUST_PROXY=1 when running behind a reverse proxy / load balancer so rate limits see the real IP
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

app.use(helmet());
app.use(
  cors({
    // Native apps send no Origin header; browsers must be on the allow-list
    origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tz-Offset'],
  }),
);
app.use(express.json({ limit: '10kb' }));

if (!env.isProd) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`));
    next();
  });
}

app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
