import { googleClient } from '../clients/GoogleClient';
import { actionLogRepository } from '../repositories/ActionLogRepository';
import { EmailMessage, ApiError } from '../types';

export class GmailService {
  private gmail = googleClient.getGmail();

  async searchEmails(query: string = 'is:unread label:important'): Promise<EmailMessage[]> {
    const start = Date.now();
    
    try {
      // Search for messages matching the query
      const listResponse = await this.gmail.users.messages.list({
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

      // Fetch details for each message
      const emails: EmailMessage[] = await Promise.all(
        messageIds.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
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
      const apiError: ApiError = {
        code: 'GMAIL_SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retry: true,
      };
      
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
