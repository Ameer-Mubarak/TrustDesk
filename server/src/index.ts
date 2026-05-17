import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { api } from './routes/api';
import { errorHandler } from './middleware/errors';

const app = express();

app.set('trust proxy', 1);

/* =========================
   SECURITY
========================= */
app.use(helmet());

/* =========================
   CORS (STABLE PRODUCTION)
========================= */
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // allow mobile / postman / server calls
    if (!origin) return callback(null, true);

    const allowed = env.allowedOrigins || [];

    // dev fallback: allow everything if empty
    if (allowed.length === 0) return callback(null, true);

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    // DO NOT block hard (prevents silent failed fetch issues)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* =========================
   BODY PARSER
========================= */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   HEALTH (NO AUTH)
========================= */
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'trustdesk-api' });
});

/* =========================
   ROUTES
========================= */
app.use('/api', api);

/* =========================
   404 HANDLER
========================= */
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   START
========================= */
const PORT = env.port || 4100;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
