import { errorHandler } from '@middleware/errorHandler';
import { rateLimiter } from '@middleware/rateLimiter';
import { requestLogger } from '@middleware/requestLogger';
import { authRoutes } from '@modules/auth/auth.routes';
import { userRoutes } from '@modules/auth/user.routes';
import ledgerRoutes from '@modules/ledger/ledger.routes';
import incomeRoutes from '@modules/income/income.routes';
import dashboardRoutes from '@modules/dashboard/dashboard.routes';
import accountsRoutes from '@modules/accounts/accounts.routes';
import expensesRoutes from '@modules/expenses/expenses.routes';
import { logger } from '@utils/logger';
import { validateEnv } from '@utils/validateEnv';
import compression from 'compression';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// Validate environment variables on startup
validateEnv();

const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxies like Render, Vercel)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting (global)
app.use(rateLimiter);

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || 'v1',
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';

// Authentication routes (public)
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// User routes (protected)
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Ledger routes (protected)
app.use(`/api/${API_VERSION}/ledger`, ledgerRoutes);

// Income routes (PAYE calculator is public, others protected)
app.use(`/api/${API_VERSION}/income`, incomeRoutes);

// Dashboard routes (protected)
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);

// Accounts routes (protected)
app.use(`/api/${API_VERSION}/accounts`, accountsRoutes);

// Expenses routes (protected)
app.use(`/api/${API_VERSION}/expenses`, expensesRoutes);

// TODO: Mount other module routes
// app.use(`/api/${API_VERSION}/budgets`, authMiddleware, budgetRouter);
// app.use(`/api/${API_VERSION}/goals`, authMiddleware, goalRouter);
// app.use(`/api/${API_VERSION}/investments`, authMiddleware, investmentRouter);
// app.use(`/api/${API_VERSION}/insights`, authMiddleware, insightRouter);

// Welcome route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'FinTracker API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/docs',
    health: '/health',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export { app };
