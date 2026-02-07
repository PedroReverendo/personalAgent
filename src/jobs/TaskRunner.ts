import { env } from '../config/env';
import { schedulerService } from '../services/SchedulerService';
import { actionLogRepository } from '../repositories/ActionLogRepository';

/**
 * TaskRunner - Worker Polling Pattern
 * Polls the database every 60 seconds for pending tasks.
 * Uses FOR UPDATE SKIP LOCKED for concurrent-safe task processing.
 */
export class TaskRunner {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private pollIntervalMs = 60000; // 60 seconds

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[TaskRunner] Already running');
      return;
    }

    console.log('[TaskRunner] Starting worker...');
    this.isRunning = true;

    // Run immediately on start
    await this.processPendingTasks();

    // Then schedule regular polling
    this.intervalId = setInterval(async () => {
      await this.processPendingTasks();
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[TaskRunner] Stopped');
  }

  private async processPendingTasks(): Promise<void> {
    try {
      const tasks = await schedulerService.getPendingTasks();

      if (tasks.length === 0) {
        return;
      }

      console.log(`[TaskRunner] Processing ${tasks.length} pending task(s)`);

      for (const task of tasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      console.error('[TaskRunner] Error processing tasks:', error);
    }
  }

  private async executeTask(task: { id: string; task_type: string; payload: Record<string, unknown> }): Promise<void> {
    const start = Date.now();

    try {
      await schedulerService.markProcessing(task.id);

      console.log(`[TaskRunner] Executing task ${task.id} (${task.task_type})`);

      // Execute based on task type
      switch (task.task_type) {
        case 'REMINDER':
          await this.handleReminder(task.payload);
          break;
        case 'DAILY_SUMMARY':
          await this.handleDailySummary(task.payload);
          break;
        case 'FOLLOW_UP':
          await this.handleFollowUp(task.payload);
          break;
        default:
          console.warn(`[TaskRunner] Unknown task type: ${task.task_type}`);
      }

      await schedulerService.markCompleted(task.id);

      await actionLogRepository.log(
        'task_runner_execute',
        { task_id: task.id, task_type: task.task_type },
        'Task completed successfully',
        Date.now() - start
      );
    } catch (error) {
      console.error(`[TaskRunner] Task ${task.id} failed:`, error);
      await schedulerService.markFailed(task.id);

      await actionLogRepository.log(
        'task_runner_execute',
        { task_id: task.id, task_type: task.task_type },
        `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - start
      );
    }
  }

  private async handleReminder(payload: Record<string, unknown>): Promise<void> {
    const message = payload.message as string;
    const webhookUrl = env.N8N_WEBHOOK_URL;

    if (webhookUrl) {
      // Send to n8n webhook
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REMINDER',
          message,
          context: payload.context || null,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`[TaskRunner] Reminder sent to n8n: ${message}`);
    } else {
      console.log(`[TaskRunner] Reminder (no webhook): ${message}`);
    }
  }

  private async handleDailySummary(payload: Record<string, unknown>): Promise<void> {
    // Placeholder for daily summary logic
    console.log('[TaskRunner] Daily summary requested', payload);
  }

  private async handleFollowUp(payload: Record<string, unknown>): Promise<void> {
    // Placeholder for follow-up logic
    console.log('[TaskRunner] Follow-up requested', payload);
  }
}

export const taskRunner = new TaskRunner();
