import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      user: env.DB_USER,
      host: env.DB_HOST,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      port: parseInt(env.DB_PORT),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query<T>(text: string, params?: unknown[]): Promise<T[]> {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    if (env.NODE_ENV === 'development') {
      console.log(`[DB] Query executed in ${duration}ms`);
    }
    
    return result.rows as T[];
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = Database.getInstance();
