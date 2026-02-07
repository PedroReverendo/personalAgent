// ============================================
// DOMAIN TYPES
// ============================================

export type TaskType = 'REMINDER' | 'DAILY_SUMMARY' | 'FOLLOW_UP';
export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ScheduledTask {
  id: string;
  task_type: TaskType;
  payload: Record<string, unknown>;
  execute_at: Date;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ActionLog {
  id: number;
  tool_name: string;
  input_params: Record<string, unknown> | null;
  output_summary: string | null;
  execution_time_ms: number | null;
  created_at: Date;
}

export interface SystemSetting {
  key: string;
  value: Record<string, unknown>;
}

// ============================================
// API TYPES
// ============================================

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface CreateEventRequest {
  summary: string;
  start: string; // ISO string
  duration_min: number;
  description?: string;
  location?: string;
}

export interface CreateReminderRequest {
  message: string;
  deliver_at: string; // ISO string
  context?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  retry?: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: boolean;
  google: boolean;
  timestamp: string;
}
