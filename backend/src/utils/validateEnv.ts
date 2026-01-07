import { logger } from './logger';

interface EnvConfig {
  [key: string]: string | undefined;
}

const requiredEnvVars: string[] = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET'];

const optionalEnvVars: string[] = ['REDIS_URL', 'CORS_ORIGINS', 'LOG_LEVEL', 'API_VERSION', 'FRONTEND_URL'];

export function validateEnv(): void {
  const missingVars: string[] = [];
  const config: EnvConfig = {};

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      config[varName] = value;
    }
  });

  // Log optional variables (warnings if missing)
  optionalEnvVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      logger.warn(`Optional environment variable ${varName} is not set`);
    } else {
      config[varName] = value;
    }
  });

  // If any required variables are missing, throw an error
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('✅ Environment variables validated successfully');
}
