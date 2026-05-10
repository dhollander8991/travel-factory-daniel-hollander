import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { UserRole } from '@org/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Pass error to next() instead of throwing directly
    // Express async error handling requires next(error) not throw
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as {
      id: string;
      role: UserRole;
      email: string;
    };

    req.user = payload;
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
  }
};

export const requireRole = (role: UserRole) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return next(
        new AppError(
          403,
          'You do not have permission to perform this action',
          'FORBIDDEN'
        )
      );
    }
    return next();
  };
};