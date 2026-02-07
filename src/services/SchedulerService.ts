import { schedulerRepository } from '../repositories/SchedulerRepository';
import { actionLogRepository } from '../repositories/ActionLogRepository';
import { CreateReminderRequest, ScheduledTask } from '../types';

export class SchedulerService {
  async createReminder(request: CreateReminderRequest): Promise<ScheduledTask> {
    const start = Date.now();
    
    const payload = {
      message: request.message,
      context: request.context || null,
    };

    const executeAt = new Date(request.deliver_at);
    
    const task = await schedulerRepository.create('REMINDER', payload, executeAt);

    await actionLogRepository.log(
      'scheduler_create_reminder',
      request as unknown as Record<string, unknown>,
      `Created reminder: ${request.message.substring(0, 50)}...`,
      Date.now() - start
    );

    return task;
  }

  async getPendingTasks(): Promise<ScheduledTask[]> {
    return schedulerRepository.getPendingTasks();
  }

  async markCompleted(id: string): Promise<void> {
    await schedulerRepository.updateStatus(id, 'COMPLETED');
  }

  async markFailed(id: string): Promise<void> {
    await schedulerRepository.updateStatus(id, 'FAILED');
  }

  async markProcessing(id: string): Promise<void> {
    await schedulerRepository.updateStatus(id, 'PROCESSING');
  }
}

export const schedulerService = new SchedulerService();
