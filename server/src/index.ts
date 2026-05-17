import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { api } from './routes/api';
import { errorHandler } from './middleware/errors';

const app = express();

app.set('trust proxy', 1);

/* =========================
   NORMALIZE DOUBLE SLASHES
========================= */
app.use((req, _res, next) => {
  req.url = req.url.replace(/\/{2,}/g, '/');
  next();
});

/* =========================
   SECURITY
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

/* =========================
   CORS
========================= */
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (env.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* =========================
   BODY PARSING
========================= */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   HEALTH
========================= */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'trustdesk-api',
    timestamp: new Date().toISOString()
  });
});

/* =========================
   API ROUTES
========================= */
app.use('/api', api);

/* =========================
   404
========================= */
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found'
    }
  });
});

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   PROCESS SAFETY
========================= */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

/* =========================
   START
========================= */
const port = env.port || 4100;

app.listen(port, () => {
  console.log(`TrustDesk API listening on port ${port}`);
});
