// index.ts — versión limpia (CommonJS-friendly)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// CORS origin from env (supports "*" or comma-separated list)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
let corsMiddleware: ReturnType<typeof cors>;
if (CORS_ORIGIN === '*') {
  corsMiddleware = cors();
} else {
  const allowed = CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
  corsMiddleware = cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser/same-origin
      return callback(null, allowed.includes(origin));
    }
  });
}
app.use(corsMiddleware);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
