import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { api } from './routes/api';
import { errorHandler } from './middleware/errors';

const app = express();

/* =========================
   TRUST PROXY (Railway / Vercel)
========================= */
app.set('trust proxy', 1);

/* =========================
   SECURITY HEADERS
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

/* =========================
   CORS CONFIG (FIXED)
   - prevents OPTIONS 500
   - avoids origin crash
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
   HEALTH CHECK
========================= */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'trustdesk',
    time: new Date().toISOString()
  });
});

/* =========================
   API ROUTES
   IMPORTANT: avoid /api// bugs
========================= */
app.use('/api', api);

/* =========================
   404 HANDLER
========================= */
app.use((_req, res) => {
  res.status(404).json({
    error: { message: 'Route not found' }
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   SAFE PROCESS HANDLERS
========================= */
process.on('unhandledRejection', (err) => {
  console.error('UnhandledRejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('UncaughtException:', err);
});

/* =========================
   START SERVER
========================= */
const port = env.port || 4100;

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
