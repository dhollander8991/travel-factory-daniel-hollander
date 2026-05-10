import { z } from 'zod';
import { RequestStatus } from '@org/shared';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createRequestSchema = z
  .object({
    // UUID string — no longer coercing to number
    userId: z.string().uuid('Invalid user ID'),
    startDate: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Start date must be in YYYY-MM-DD format'
    ),
    endDate: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'End date must be in YYYY-MM-DD format'
    ),
    reason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })
  .refine(
    (data) => data.startDate >= new Date().toISOString().split('T')[0],
    {
      message: 'Start date cannot be in the past',
      path: ['startDate'],
    }
  );

export const updateRequestSchema = z
  .object({
    status: z.enum([RequestStatus.APPROVED, RequestStatus.REJECTED]),
    comments: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.status === RequestStatus.REJECTED) {
        return data.comments && data.comments.trim().length > 0;
      }
      return true;
    },
    {
      message: 'A comment is required when rejecting a request',
      path: ['comments'],
    }
  );