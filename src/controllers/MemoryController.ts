import { Request, Response } from 'express';
import { z } from 'zod';
import { memoryService } from '../services/MemoryService';
import { ApiResponse } from '../types';

// Validation schemas
const saveMemorySchema = z.object({
  content: z.string().min(1, 'content is required'),
  category: z.string().optional(),
});

const retrieveContextSchema = z.object({
  query: z.string().min(1, 'query is required'),
  top_k: z.number().min(1).max(20).default(5),
  threshold: z.number().min(0).max(2).default(0.7),
});

export class MemoryController {
  /**
   * POST /api/v1/memories
   * Save a new memory
   */
  async saveMemory(req: Request, res: Response): Promise<void> {
    const validation = saveMemorySchema.safeParse(req.body);
    
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

    try {
      const { content, category } = validation.data;
      const result = await memoryService.saveMemory(content, category);
      
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'MEMORY_SAVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retry: true,
        },
      };
      res.status(500).json(response);
    }
  }

  /**
   * POST /api/v1/context/retrieve
   * Retrieve relevant context for a query
   */
  async retrieveContext(req: Request, res: Response): Promise<void> {
    const validation = retrieveContextSchema.safeParse(req.body);
    
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

    try {
      const { query, top_k, threshold } = validation.data;
      const results = await memoryService.retrieveContext(query, top_k, threshold);
      
      const response: ApiResponse<typeof results> = {
        success: true,
        data: results,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'CONTEXT_RETRIEVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retry: true,
        },
      };
      res.status(500).json(response);
    }
  }
}

export const memoryController = new MemoryController();
