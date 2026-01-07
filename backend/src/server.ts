import 'dotenv/config';

import { initializeDatabase } from '@config/database';
import { initializeRedis } from '@config/redis';
import { logger } from '@utils/logger';

import { app } from './app';

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('✅ Database connected successfully');

    // Initialize Redis connection
    logger.info('Initializing Redis connection...');
    await initializeRedis();
    logger.info('✅ Redis connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📡 API Version: ${process.env.API_VERSION || 'v1'}`);
      logger.info(`🌐 CORS Origins: ${process.env.CORS_ORIGINS || 'http://localhost:5173'}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string): void => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          const { closeDatabase } = await import('@config/database');
          await closeDatabase();
          logger.info('Database connection closed');

          // Close Redis connection
          const { closeRedis } = await import('@config/redis');
          await closeRedis();
          logger.info('Redis connection closed');

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Promise Rejection:', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
void startServer();
