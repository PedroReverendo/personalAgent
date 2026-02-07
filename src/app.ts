import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { env } from './config/env';
import routes from './routes';
import { authMiddleware, loggerMiddleware, errorHandler } from './middleware';
import { taskRunner } from './jobs/TaskRunner';

const app = express();

// Middleware
app.use(express.json());
app.use(loggerMiddleware);
app.use(authMiddleware);

// Routes
app.use(routes);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[App] SIGTERM received, shutting down...');
  await taskRunner.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[App] SIGINT received, shutting down...');
  await taskRunner.stop();
  process.exit(0);
});

// Start server
app.listen(parseInt(env.PORT), () => {
  console.log(`[App] MoltBot Backend running on port ${env.PORT}`);
  console.log(`[App] Environment: ${env.NODE_ENV}`);
  
  // Start task runner worker
  taskRunner.start().catch(console.error);
});

export default app;
