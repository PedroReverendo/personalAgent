import { db } from '../config/database';
import { ScheduledTask, TaskStatus, TaskType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SchedulerRepository {
  async create(
    taskType: TaskType,
    payload: Record<string, unknown>,
    executeAt: Date
  ): Promise<ScheduledTask> {
    const id = uuidv4();
    const query = `
      INSERT INTO scheduled_tasks (id, task_type, payload, execute_at, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *
    `;
    const rows = await db.query<ScheduledTask>(query, [
      id,
      taskType,
      JSON.stringify(payload),
      executeAt.toISOString(),
    ]);
    return rows[0];
  }

  async getPendingTasks(): Promise<ScheduledTask[]> {
    const query = `
      SELECT * FROM scheduled_tasks 
      WHERE status = 'PENDING' AND execute_at <= NOW()
      ORDER BY execute_at ASC
      FOR UPDATE SKIP LOCKED
    `;
    return db.query<ScheduledTask>(query);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const query = `
      UPDATE scheduled_tasks 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    await db.query(query, [status, id]);
  }

  async getById(id: string): Promise<ScheduledTask | null> {
    const query = 'SELECT * FROM scheduled_tasks WHERE id = $1';
    const rows = await db.query<ScheduledTask>(query, [id]);
    return rows[0] || null;
  }

  async deleteById(id: string): Promise<void> {
    await db.query('DELETE FROM scheduled_tasks WHERE id = $1', [id]);
  }
}

export const schedulerRepository = new SchedulerRepository();
