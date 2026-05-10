/**
 * Tests for requireAuth and requireRole middleware.
 * jwt.verify is mocked so no real tokens are generated or verified.
 */

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from './auth';
import { AppError } from './errorHandler';
import { UserRole } from '@org/shared';

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

const makeReq = (overrides: Partial<Request> = {}) => overrides as Request;
const makeRes = () => ({} as Response);
const makeNext = () => vi.fn() as unknown as NextFunction;

const validPayload = { id: 'u1', role: UserRole.REQUESTER, email: 'alice@example.com' };

describe('requireAuth', () => {
  it('calls next(AppError 401) when authorization header is missing', () => {
    const next = makeNext();
    requireAuth(makeReq({ headers: {} }), makeRes(), next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('calls next(AppError 401) when header does not start with "Bearer "', () => {
    const next = makeNext();
    requireAuth(
      makeReq({ headers: { authorization: 'Basic abc123' } }),
      makeRes(),
      next,
    );

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('attaches the decoded payload to req.user and calls next() on a valid token', () => {
    vi.mocked(jwt.verify).mockReturnValue(validPayload as any);

    const req = makeReq({ headers: { authorization: 'Bearer valid.token.here' } });
    const next = makeNext();

    requireAuth(req, makeRes(), next);

    expect(req.user).toEqual(validPayload);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(AppError 401 INVALID_TOKEN) when jwt.verify throws', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const next = makeNext();
    requireAuth(
      makeReq({ headers: { authorization: 'Bearer bad.token' } }),
      makeRes(),
      next,
    );

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('INVALID_TOKEN');
  });
});

describe('requireRole', () => {
  it('calls next() with no arguments when the user has the required role', () => {
    const next = makeNext();
    const req = makeReq({ user: validPayload });

    requireRole(UserRole.REQUESTER)(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(AppError 403) when the user role does not match', () => {
    const next = makeNext();
    const req = makeReq({ user: validPayload }); // REQUESTER role

    requireRole(UserRole.VALIDATOR)(req, makeRes(), next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('calls next(AppError 403) when req.user is undefined', () => {
    const next = makeNext();
    const req = makeReq({});

    requireRole(UserRole.REQUESTER)(req, makeRes(), next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });
});
