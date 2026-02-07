import { googleClient } from '../clients/GoogleClient';
import { actionLogRepository } from '../repositories/ActionLogRepository';
import { CalendarEvent, CreateEventRequest, ApiError } from '../types';

export class CalendarService {
  private getCalendar() {
    const calendar = googleClient.getCalendar();
    if (!calendar) {
      throw {
        code: 'GOOGLE_NOT_CONFIGURED',
        message: 'Google Calendar is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.',
        retry: false,
      } as ApiError;
    }
    return calendar;
  }

  async getUpcomingEvents(hours: number = 24): Promise<CalendarEvent[]> {
    const start = Date.now();
    
    try {
      const calendar = this.getCalendar();
      const now = new Date();
      const timeMax = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      const events: CalendarEvent[] = (response.data.items || []).map((event) => ({
        id: event.id || '',
        summary: event.summary || '(No title)',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || undefined,
        location: event.location || undefined,
      }));

      await actionLogRepository.log(
        'google_calendar_list',
        { hours },
        `Retrieved ${events.length} events`,
        Date.now() - start
      );

      return events;
    } catch (error) {
      const apiError: ApiError = error as ApiError;
      if (!apiError.code) {
        apiError.code = 'GOOGLE_CALENDAR_ERROR';
        apiError.message = error instanceof Error ? error.message : 'Unknown error';
        apiError.retry = true;
      }
      
      await actionLogRepository.log(
        'google_calendar_list',
        { hours },
        `Error: ${apiError.message}`,
        Date.now() - start
      );
      
      throw apiError;
    }
  }

  async createEvent(request: CreateEventRequest): Promise<CalendarEvent> {
    const start = Date.now();
    
    try {
      const calendar = this.getCalendar();
      const startDate = new Date(request.start);
      const endDate = new Date(startDate.getTime() + request.duration_min * 60 * 1000);

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: request.summary,
          description: request.description,
          location: request.location,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      });

      const event: CalendarEvent = {
        id: response.data.id || '',
        summary: response.data.summary || '',
        start: response.data.start?.dateTime || '',
        end: response.data.end?.dateTime || '',
        description: response.data.description || undefined,
        location: response.data.location || undefined,
      };

      await actionLogRepository.log(
        'google_calendar_insert',
        request as unknown as Record<string, unknown>,
        `Created event: ${event.summary}`,
        Date.now() - start
      );

      return event;
    } catch (error) {
      const apiError: ApiError = error as ApiError;
      if (!apiError.code) {
        apiError.code = 'GOOGLE_CALENDAR_CREATE_ERROR';
        apiError.message = error instanceof Error ? error.message : 'Unknown error';
        apiError.retry = true;
      }
      
      await actionLogRepository.log(
        'google_calendar_insert',
        request as unknown as Record<string, unknown>,
        `Error: ${apiError.message}`,
        Date.now() - start
      );
      
      throw apiError;
    }
  }
}

export const calendarService = new CalendarService();
