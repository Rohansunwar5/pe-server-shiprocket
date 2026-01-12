import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't throw error if missing
 * Useful for endpoints that work for both authenticated and guest users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as {
          _id: string;
          email: string;
        };

        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we don't throw error
        // Just continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};