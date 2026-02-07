import { google, calendar_v3, Auth } from 'googleapis';
import { env } from '../config/env';

/**
 * GoogleClient Singleton
 * Manages OAuth2 authentication with automatic token refresh.
 * Uses the official googleapis library.
 */
class GoogleClient {
  private static instance: GoogleClient;
  private oauth2Client: Auth.OAuth2Client;
  private calendar: calendar_v3.Calendar | null = null;
  private gmail: ReturnType<typeof google.gmail> | null = null;

  private constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    );

    // Set the refresh token - the library handles access token refresh automatically
    this.oauth2Client.setCredentials({
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    });

    // Listen for token refresh events
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.access_token) {
        console.log('[GoogleClient] Access token refreshed');
      }
    });
  }

  public static getInstance(): GoogleClient {
    if (!GoogleClient.instance) {
      GoogleClient.instance = new GoogleClient();
    }
    return GoogleClient.instance;
  }

  public getCalendar(): calendar_v3.Calendar {
    if (!this.calendar) {
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }
    return this.calendar;
  }

  public getGmail(): ReturnType<typeof google.gmail> {
    if (!this.gmail) {
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }
    return this.gmail;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Try to get calendar list as a health check
      await this.getCalendar().calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('[GoogleClient] Health check failed:', error);
      return false;
    }
  }

  public getAuth(): Auth.OAuth2Client {
    return this.oauth2Client;
  }
}

export const googleClient = GoogleClient.getInstance();
