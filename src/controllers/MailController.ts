import { Request, Response } from 'express';
import { gmailService } from '../services/GmailService';
import { ApiResponse, EmailMessage, ApiError } from '../types';

export class MailController {
  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || 'is:unread label:important';
      const emails = await gmailService.searchEmails(query);
      
      const response: ApiResponse<EmailMessage[]> = {
        success: true,
        data: emails,
      };
      
      res.json(response);
    } catch (error) {
      const apiError = error as ApiError;
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: apiError.code || 'GMAIL_ERROR',
          message: apiError.message || 'Failed to search emails',
          retry: apiError.retry ?? true,
        },
      };
      
      res.status(500).json(response);
    }
  }
}

export const mailController = new MailController();
