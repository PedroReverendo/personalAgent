import { db } from '../config/database';
import { ActionLog } from '../types';

export class ActionLogRepository {
  async log(
    toolName: string,
    inputParams: Record<string, unknown> | null,
    outputSummary: string | null,
    executionTimeMs: number | null
  ): Promise<ActionLog> {
    const query = `
      INSERT INTO action_logs (tool_name, input_params, output_summary, execution_time_ms)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const rows = await db.query<ActionLog>(query, [
      toolName,
      inputParams ? JSON.stringify(inputParams) : null,
      outputSummary,
      executionTimeMs,
    ]);
    return rows[0];
  }

  async getRecent(limit: number = 50): Promise<ActionLog[]> {
    const query = `
      SELECT * FROM action_logs 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    return db.query<ActionLog>(query, [limit]);
  }

  async getByToolName(toolName: string, limit: number = 20): Promise<ActionLog[]> {
    const query = `
      SELECT * FROM action_logs 
      WHERE tool_name = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    return db.query<ActionLog>(query, [toolName, limit]);
  }
}

export const actionLogRepository = new ActionLogRepository();
