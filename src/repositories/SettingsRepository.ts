import { db } from '../config/database';
import { SystemSetting } from '../types';

export class SettingsRepository {
  async get<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const query = 'SELECT value FROM system_settings WHERE key = $1';
    const rows = await db.query<{ value: T }>(query, [key]);
    return rows[0]?.value || null;
  }

  async set(key: string, value: Record<string, unknown>): Promise<void> {
    const query = `
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `;
    await db.query(query, [key, JSON.stringify(value)]);
  }

  async delete(key: string): Promise<void> {
    await db.query('DELETE FROM system_settings WHERE key = $1', [key]);
  }

  async getAll(): Promise<SystemSetting[]> {
    return db.query<SystemSetting>('SELECT * FROM system_settings');
  }
}

export const settingsRepository = new SettingsRepository();
