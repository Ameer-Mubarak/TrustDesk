import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { api } from './routes/api';
import { errorHandler } from './middleware/errors';

const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`TrustDesk API listening on ${env.port}`);
});
