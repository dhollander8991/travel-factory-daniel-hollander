import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];

        return next(
          new AppError(
            400,
            firstIssue.message,
            'VALIDATION_ERROR',
            firstIssue.path[0]?.toString()
          )
        );
      }
      return next(error);
    }
  };
};