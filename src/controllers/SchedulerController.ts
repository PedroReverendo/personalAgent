import { Request, Response } from 'express';
import { z } from 'zod';
import { schedulerService } from '../services/SchedulerService';
import { ApiResponse, ScheduledTask, ApiError } from '../types';

const createReminderSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  deliver_at: z.string().datetime({ message: 'deliver_at must be a valid ISO datetime' }),
  context: z.string().optional(),
});

export class SchedulerController {
  async createReminder(req: Request, res: Response): Promise<void> {
    try {
      const validation = createReminderSchema.safeParse(req.body);
      
      if (!validation.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.issues.map(e => e.message).join(', '),
            retry: false,
          },
        };
        res.status(400).json(response);
        return;
      }

      const task = await schedulerService.createReminder(validation.data);
      
      const response: ApiResponse<ScheduledTask> = {
        success: true,
        data: task,
      };
      
      res.status(201).json(response);
    } catch (error) {
      const apiError = error as ApiError;
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: apiError.code || 'SCHEDULER_ERROR',
          message: apiError.message || 'Failed to create reminder',
          retry: apiError.retry ?? true,
        },
      };
      
      res.status(500).json(response);
    }
  }
}

export const schedulerController = new SchedulerController();
