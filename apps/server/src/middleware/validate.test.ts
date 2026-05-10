/**
 * Tests for the validate middleware — verifies that valid bodies pass
 * through unchanged, Zod validation errors are converted to AppError(400),
 * and unexpected errors are forwarded as-is.
 */

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validate';
import { AppError } from './errorHandler';

const makeReq = (body: unknown) => ({ body } as Request);
const makeRes = () => ({} as Response);

describe('validate middleware', () => {
  it('calls next() with no arguments when the body is valid', () => {
    const schema = z.object({ name: z.string().min(1) });
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(makeReq({ name: 'Alice' }), makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('mutates req.body with the parsed (coerced) value', () => {
    const schema = z.object({ count: z.coerce.number() });
    const req = makeReq({ count: '42' });
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(req, makeRes(), next);

    expect(req.body.count).toBe(42);
  });

  it('calls next(AppError) with status 400 and VALIDATION_ERROR code on Zod failure', () => {
    const schema = z.object({ email: z.string().email('Invalid email address') });
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(makeReq({ email: 'not-an-email' }), makeRes(), next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid email address');
  });

  it('sets the field on AppError when the Zod issue has a path', () => {
    const schema = z.object({ password: z.string().min(8, 'Too short') });
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(makeReq({ password: 'short' }), makeRes(), next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err.field).toBe('password');
  });

  it('forwards non-Zod errors directly to next()', () => {
    const boom = new Error('unexpected');
    const schema = { parse: () => { throw boom; } } as any;
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(makeReq({}), makeRes(), next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});
