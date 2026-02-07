import { googleClient } from '../clients/GoogleClient';
import { actionLogRepository } from '../repositories/ActionLogRepository';
import { EmailMessage, ApiError } from '../types';

export class GmailService {
  private getGmail() {
    const gmail = googleClient.getGmail();
    if (!gmail) {
      throw {
        code: 'GOOGLE_NOT_CONFIGURED',
        message: 'Gmail is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.',
        retry: false,
      } as ApiError;
    }
    return gmail;
  }

  async searchEmails(query: string = 'is:unread label:important'): Promise<EmailMessage[]> {
    const start = Date.now();
    
    try {
      const gmail = this.getGmail();
      
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 20,
      });

      const messageIds = listResponse.data.messages || [];
      
      if (messageIds.length === 0) {
        await actionLogRepository.log(
          'gmail_search',
          { query },
          'No messages found',
          Date.now() - start
        );
        return [];
      }

      const emails: EmailMessage[] = await Promise.all(
        messageIds.map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = detail.data.payload?.headers || [];
          const getHeader = (name: string) => 
            headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: detail.data.id || '',
            threadId: detail.data.threadId || '',
            from: getHeader('From'),
            subject: getHeader('Subject'),
            snippet: detail.data.snippet || '',
            date: getHeader('Date'),
          };
        })
      );

      await actionLogRepository.log(
        'gmail_search',
        { query },
        `Found ${emails.length} emails`,
        Date.now() - start
      );

      return emails;
    } catch (error) {
      const apiError: ApiError = error as ApiError;
      if (!apiError.code) {
        apiError.code = 'GMAIL_SEARCH_ERROR';
        apiError.message = error instanceof Error ? error.message : 'Unknown error';
        apiError.retry = true;
      }
      
      await actionLogRepository.log(
        'gmail_search',
        { query },
        `Error: ${apiError.message}`,
        Date.now() - start
      );
      
      throw apiError;
    }
  }
}

export const gmailService = new GmailService();
