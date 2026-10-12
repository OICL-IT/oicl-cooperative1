import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import governanceRoutes from './routes/governanceRoutes.js';
import financialStatusRoutes from './routes/financialStatusRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/financial-status', financialStatusRoutes);

// --- Vite Integration ---
export const setupVite = async (expressApp: express.Application) => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(__dirname, '../../frontend'),
      configFile: path.resolve(__dirname, '../../frontend/vite.config.ts'),
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../../frontend/dist');
    if (fs.existsSync(path.join(distPath, 'index.html'))) {
      expressApp.use(express.static(distPath));
      expressApp.get('*', (req: any, res: any) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // Frontend is deployed separately (e.g. Vercel); this service is API-only.
      expressApp.get('/', (_req: any, res: any) => {
        res.json({ status: 'ok', service: 'OICL API' });
      });
    }
  }
};

export default app;
