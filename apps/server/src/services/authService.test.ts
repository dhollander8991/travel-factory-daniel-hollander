/**
 * Tests for authService — covers register and login flows.
 * All DB and crypto calls are mocked so no real database or bcrypt work occurs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login } from './authService';
import { AppDataSource } from '../config/database';
import { UserRole } from '@org/shared';

vi.mock('../config/database', () => ({
  AppDataSource: { getRepository: vi.fn() },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

const mockQb = {
  addSelect: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  getOne: vi.fn(),
};

const mockUserRepo = {
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  createQueryBuilder: vi.fn().mockReturnValue(mockQb),
};

beforeEach(() => {
  vi.mocked(AppDataSource.getRepository).mockReturnValue(mockUserRepo as any);
});

describe('register', () => {
  it('returns the new user without the password field', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as never);

    const created = {
      id: 'uuid-1',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed_pw',
      role: UserRole.REQUESTER,
      createdAt: new Date(),
    };
    mockUserRepo.create.mockReturnValue(created);
    mockUserRepo.save.mockResolvedValue(created);

    const result = await register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      role: UserRole.REQUESTER,
    });

    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('alice@example.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });

  it('throws AppError 409 when email is already registered', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

    await expect(
      register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        role: UserRole.REQUESTER,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_EXISTS',
    });
  });
});

describe('login', () => {
  it('returns a JWT token and the user without password on success', async () => {
    const storedUser = {
      id: 'uuid-1',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed_pw',
      role: UserRole.REQUESTER,
    };
    mockQb.getOne.mockResolvedValue(storedUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

    const result = await login({ email: 'alice@example.com', password: 'password123', requiredRole: UserRole.REQUESTER });

    expect(result.token).toBe('mock-token');
    expect(result.user).not.toHaveProperty('password');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'uuid-1', role: UserRole.REQUESTER, email: 'alice@example.com' },
      expect.any(String),
      { expiresIn: '7d' },
    );
  });

  it('throws AppError 403 when user role does not match the required portal role', async () => {
    const storedUser = {
      id: 'uuid-1',
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hashed_pw',
      role: UserRole.VALIDATOR,
    };
    mockQb.getOne.mockResolvedValue(storedUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      login({ email: 'bob@example.com', password: 'password123', requiredRole: UserRole.REQUESTER }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'WRONG_PORTAL',
    });
  });

  it('throws AppError 401 when user is not found', async () => {
    mockQb.getOne.mockResolvedValue(null);

    await expect(
      login({ email: 'nobody@example.com', password: 'password123', requiredRole: UserRole.REQUESTER }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('throws AppError 401 when password is incorrect', async () => {
    mockQb.getOne.mockResolvedValue({
      id: 'uuid-1',
      email: 'alice@example.com',
      password: 'hashed_pw',
      role: UserRole.REQUESTER,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      login({ email: 'alice@example.com', password: 'wrong', requiredRole: UserRole.REQUESTER }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });
});
