import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { timingSafeEqual } from 'crypto';

import './utils/firebaseAdmin.js';
import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import heroRoutes from './routes/heroRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import buddyRoutes from './routes/buddyRoutes.js';
import { escalateUnansweredRequests } from './services/escalation.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Request logger
app.use((req, res, next) => {
  console.log(`[API ${req.method}] ${req.path}`);
  next();
});

// Middleware - allow local development and Vercel production origin
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'https://rakta-run-repo.vercel.app'
  ], 
  credentials: true 
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RaktaRun API',
    timestamp: new Date().toISOString(),
  });
});

// Vercel functions do not keep a process timer alive. Trigger escalation from
// an external scheduler (or a paid Vercel Cron schedule) using a bearer secret.
app.get('/api/cron/escalation', async (req, res) => {
  const secret = process.env.ESCALATION_CRON_SECRET || process.env.CRON_SECRET;
  const provided = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  if (!secret) return res.status(503).json({ error: 'Escalation scheduler is not configured.' });
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const escalated = await escalateUnansweredRequests();
    return res.json({ status: 'ok', escalated });
  } catch (error) {
    console.error('[ESCALATION CRON]', error);
    return res.status(500).json({ error: 'Escalation run failed.' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/heroes', heroRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/buddies', buddyRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'RaktaRun API v1 — ready' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`RaktaRun API running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
