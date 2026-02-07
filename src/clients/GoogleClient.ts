import { google, calendar_v3, Auth } from 'googleapis';
import { env } from '../config/env';

/**
 * GoogleClient Singleton
 * Manages OAuth2 authentication with automatic token refresh.
 * Uses the official googleapis library.
 */
class GoogleClient {
  private static instance: GoogleClient | null = null;
  private oauth2Client: Auth.OAuth2Client | null = null;
  private calendar: calendar_v3.Calendar | null = null;
  private gmail: ReturnType<typeof google.gmail> | null = null;
  private initialized = false;

  private constructor() {
    // Lazy initialization - don't set up OAuth2 until credentials are available
  }

  private initialize(): void {
    if (this.initialized) return;

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
      console.warn('[GoogleClient] Google credentials not configured - Google features disabled');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    );

    this.oauth2Client.setCredentials({
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    });

    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.access_token) {
        console.log('[GoogleClient] Access token refreshed');
      }
    });

    this.initialized = true;
    console.log('[GoogleClient] Initialized successfully');
  }

  public static getInstance(): GoogleClient {
    if (!GoogleClient.instance) {
      GoogleClient.instance = new GoogleClient();
    }
    return GoogleClient.instance;
  }

  public getCalendar(): calendar_v3.Calendar | null {
    this.initialize();
    if (!this.oauth2Client) return null;
    
    if (!this.calendar) {
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }
    return this.calendar;
  }

  public getGmail(): ReturnType<typeof google.gmail> | null {
    this.initialize();
    if (!this.oauth2Client) return null;
    
    if (!this.gmail) {
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }
    return this.gmail;
  }

  public async healthCheck(): Promise<boolean> {
    this.initialize();
    if (!this.oauth2Client) {
      console.log('[GoogleClient] No credentials configured');
      return false;
    }
    
    try {
      const calendar = this.getCalendar();
      if (!calendar) return false;
      await calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('[GoogleClient] Health check failed:', error);
      return false;
    }
  }

  public isConfigured(): boolean {
    return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
  }

  public getAuth(): Auth.OAuth2Client | null {
    this.initialize();
    return this.oauth2Client;
  }
}

export const googleClient = GoogleClient.getInstance();
