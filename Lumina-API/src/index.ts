import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { inquiriesRouter } from './routes/inquiries.js';
import { appointmentsRouter } from './routes/appointments.js';
import { intakeRouter } from './routes/intake.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o.trim()))) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Root & Health Check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    message: 'Welcome to Lumina Dental Studio API',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Lumina Dental Studio API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/intake', intakeRouter);

app.listen(PORT, () => {
  console.log(`🚀 [Lumina-API] Server active and listening on http://localhost:${PORT}`);
});
