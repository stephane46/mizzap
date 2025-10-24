import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import photosRouter from './routes/photos';

/**
 * Create and configure Express application
 */
const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet()); // Security headers
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/photos', photosRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    const app = createApp();

    app.listen(config.port, () => {
      console.log('🚀 MIZZAP Backend Server Started');
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🌐 Server running on http://localhost:${config.port}`);
      console.log(`✅ Health check: http://localhost:${config.port}/health`);
      console.log('\n⏳ Waiting for requests...');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  void startServer();
}

// Export for testing
export { createApp, startServer };