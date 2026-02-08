import { Router } from 'express';
import { calendarController } from '../controllers/CalendarController';
import { schedulerController } from '../controllers/SchedulerController';
import { mailController } from '../controllers/MailController';
import { memoryController } from '../controllers/MemoryController';
import { db } from '../config/database';
import { googleClient } from '../clients/GoogleClient';
import { HealthStatus, ApiResponse } from '../types';

const router = Router();

// ============================================
// CALENDAR ROUTES
// ============================================
router.get('/api/v1/calendar/upcoming', (req, res) => calendarController.getUpcoming(req, res));
router.post('/api/v1/calendar/create', (req, res) => calendarController.create(req, res));

// ============================================
// SCHEDULER ROUTES
// ============================================
router.post('/api/v1/scheduler/remind', (req, res) => schedulerController.createReminder(req, res));

// ============================================
// MAIL ROUTES
// ============================================
router.get('/api/v1/mail/search', (req, res) => mailController.search(req, res));

// ============================================
// MEMORY ROUTES (Vector Search)
// ============================================
router.post('/api/v1/memories', (req, res) => memoryController.saveMemory(req, res));
router.post('/api/v1/context/retrieve', (req, res) => memoryController.retrieveContext(req, res));

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', async (_req, res) => {
  const [dbHealthy, googleHealthy] = await Promise.all([
    db.healthCheck(),
    googleClient.healthCheck(),
  ]);

  const status: HealthStatus = {
    status: dbHealthy && googleHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy,
    google: googleHealthy,
    timestamp: new Date().toISOString(),
  };

  const response: ApiResponse<HealthStatus> = {
    success: status.status === 'healthy',
    data: status,
  };

  res.status(status.status === 'healthy' ? 200 : 503).json(response);
});

export default router;

