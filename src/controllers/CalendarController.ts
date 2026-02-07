import { Request, Response } from 'express';
import { z } from 'zod';
import { calendarService } from '../services/CalendarService';
import { ApiResponse, CalendarEvent, ApiError } from '../types';

// Zod schemas for validation
const createEventSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  start: z.string().datetime({ message: 'Start must be a valid ISO datetime' }),
  duration_min: z.number().min(1).max(1440),
  description: z.string().optional(),
  location: z.string().optional(),
});

export class CalendarController {
  async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const events = await calendarService.getUpcomingEvents(hours);
      
      const response: ApiResponse<CalendarEvent[]> = {
        success: true,
        data: events,
      };
      
      res.json(response);
    } catch (error) {
      const apiError = error as ApiError;
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: apiError.code || 'CALENDAR_ERROR',
          message: apiError.message || 'Failed to fetch events',
          retry: apiError.retry ?? true,
        },
      };
      
      res.status(500).json(response);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = createEventSchema.safeParse(req.body);
      
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

      const event = await calendarService.createEvent(validation.data);
      
      const response: ApiResponse<CalendarEvent> = {
        success: true,
        data: event,
      };
      
      res.status(201).json(response);
    } catch (error) {
      const apiError = error as ApiError;
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: apiError.code || 'CALENDAR_CREATE_ERROR',
          message: apiError.message || 'Failed to create event',
          retry: apiError.retry ?? true,
        },
      };
      
      res.status(500).json(response);
    }
  }
}

export const calendarController = new CalendarController();
