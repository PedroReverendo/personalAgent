import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API Security
  API_KEY: z.string().min(1, 'API_KEY is required for n8n authentication'),
  
  // PostgreSQL
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REFRESH_TOKEN: z.string().min(1, 'GOOGLE_REFRESH_TOKEN is required'),
  
  // n8n Webhook (for task notifications)
  N8N_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      console.error(`❌ Environment validation failed:\n${missing}`);
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
