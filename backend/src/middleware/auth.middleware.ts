import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from './errorHandler';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  _res: Response, // Unused but required by Express middleware signature
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'NO_TOKEN', 'No authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user to request
    (req as any).user = payload;

    next();
  } catch (error) {
    next(error);
  }
};