import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { guidanceService } from '../services/guidance/guidanceService';

export const guidanceRouter = Router();

/**
 * GET /api/v1/guidance-prompts
 * List all guidance prompts.
 * Requires authentication.
 */
guidanceRouter.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const prompts = await guidanceService.list();
    res.status(200).json(prompts);
  } catch (err) {
    console.error('GET /guidance-prompts error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch guidance prompts' });
  }
});
