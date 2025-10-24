import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 * 
 * Returns server status and basic information
 * Used for monitoring and load balancer health checks
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: '0.1.0',
      uptime: process.uptime(),
    },
  });
});

export default router;