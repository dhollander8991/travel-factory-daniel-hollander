/**
 * Tests for requestService — covers getAllRequests, getUserRequests,
 * createRequest, and updateRequest including conflict detection and
 * status-transition guards. All DB calls are mocked via a QueryBuilder stub.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllRequests,
  getUserRequests,
  createRequest,
  updateRequest,
} from './requestService';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { RequestStatus, UserRole } from '@org/shared';

vi.mock('../config/database', () => ({
  AppDataSource: { getRepository: vi.fn() },
}));

const makeQb = (overrides: Record<string, unknown> = {}) => ({
  leftJoinAndSelect: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
  getOne: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const mockUserRepo = {
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  createQueryBuilder: vi.fn(),
};

const mockRequestRepo = {
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  createQueryBuilder: vi.fn(),
};

beforeEach(() => {
  vi.mocked(AppDataSource.getRepository).mockImplementation((entity: any) => {
    if (entity === User) return mockUserRepo as any;
    return mockRequestRepo as any;
  });
});

describe('getAllRequests', () => {
  it('returns all requests when no status filter is given', async () => {
    const fakeRequests = [{ id: 'r1' }, { id: 'r2' }];
    const qb = makeQb({ getManyAndCount: vi.fn().mockResolvedValue([fakeRequests, 2]) });
    mockRequestRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await getAllRequests({});

    expect(result.requests).toEqual(fakeRequests);
    expect(result.total).toBe(2);
    expect(qb.where).not.toHaveBeenCalled();
  });

  it('applies a WHERE clause when status filter is provided', async () => {
    const qb = makeQb();
    mockRequestRepo.createQueryBuilder.mockReturnValue(qb);

    await getAllRequests({ status: RequestStatus.PENDING });

    expect(qb.where).toHaveBeenCalledWith('request.status = :status', {
      status: RequestStatus.PENDING,
    });
  });
});

describe('getUserRequests', () => {
  it('returns only requests belonging to the given user', async () => {
    const fakeRequests = [{ id: 'r1', user: { id: 'u1' } }];
    const qb = makeQb({ getManyAndCount: vi.fn().mockResolvedValue([fakeRequests, 1]) });
    mockRequestRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await getUserRequests({ userId: 'u1' });

    expect(result.requests).toEqual(fakeRequests);
    expect(qb.where).toHaveBeenCalledWith('user.id = :userId', { userId: 'u1' });
  });

  it('adds andWhere when an optional status filter is provided', async () => {
    const qb = makeQb();
    mockRequestRepo.createQueryBuilder.mockReturnValue(qb);

    await getUserRequests({ userId: 'u1', status: RequestStatus.APPROVED });

    expect(qb.andWhere).toHaveBeenCalledWith('request.status = :status', {
      status: RequestStatus.APPROVED,
    });
  });
});

describe('createRequest', () => {
  const baseParams = {
    userId: 'u1',
    startDate: '2099-08-01',
    endDate: '2099-08-05',
    reason: 'Holiday',
  };

  const fakeUser = {
    id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role: UserRole.REQUESTER,
  };

  it('creates and returns the new vacation request', async () => {
    mockUserRepo.findOne.mockResolvedValue(fakeUser);

    const conflictQb = makeQb({ getOne: vi.fn().mockResolvedValue(null) });
    mockRequestRepo.createQueryBuilder.mockReturnValue(conflictQb);

    const newRequest = { id: 'r-new', ...baseParams, status: RequestStatus.PENDING };
    mockRequestRepo.create.mockReturnValue(newRequest);
    mockRequestRepo.save.mockResolvedValue(newRequest);

    const result = await createRequest(baseParams);

    expect(result).toMatchObject({ status: RequestStatus.PENDING });
    expect(mockRequestRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: baseParams.startDate, endDate: baseParams.endDate }),
    );
  });

  it('throws AppError 404 when user does not exist', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(createRequest(baseParams)).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('throws AppError 409 when dates conflict with an existing request', async () => {
    mockUserRepo.findOne.mockResolvedValue(fakeUser);

    const conflictingRequest = {
      id: 'r-existing',
      startDate: '2099-08-01',
      endDate: '2099-08-10',
      status: RequestStatus.PENDING,
    };
    const conflictQb = makeQb({ getOne: vi.fn().mockResolvedValue(conflictingRequest) });
    mockRequestRepo.createQueryBuilder.mockReturnValue(conflictQb);

    await expect(createRequest(baseParams)).rejects.toMatchObject({
      statusCode: 409,
      code: 'DATE_CONFLICT',
    });
  });
});

describe('updateRequest', () => {
  it('approves a pending request', async () => {
    const pending = {
      id: 'r1',
      status: RequestStatus.PENDING,
      user: { id: 'u1' },
      comments: null,
    };
    mockRequestRepo.findOne.mockResolvedValue(pending);
    mockRequestRepo.save.mockResolvedValue({ ...pending, status: RequestStatus.APPROVED });

    const result = await updateRequest({ requestId: 'r1', status: RequestStatus.APPROVED });

    expect(result.status).toBe(RequestStatus.APPROVED);
  });

  it('rejects a pending request and stores the comment', async () => {
    const pending = {
      id: 'r1',
      status: RequestStatus.PENDING,
      user: { id: 'u1' },
      comments: null,
    };
    mockRequestRepo.findOne.mockResolvedValue(pending);
    mockRequestRepo.save.mockImplementation(async (req: any) => req);

    const result = await updateRequest({
      requestId: 'r1',
      status: RequestStatus.REJECTED,
      comments: 'Too many overlaps',
    });

    expect(result.status).toBe(RequestStatus.REJECTED);
    expect(result.comments).toBe('Too many overlaps');
  });

  it('throws AppError 404 when the request does not exist', async () => {
    mockRequestRepo.findOne.mockResolvedValue(null);

    await expect(
      updateRequest({ requestId: 'missing', status: RequestStatus.APPROVED }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'REQUEST_NOT_FOUND',
    });
  });

  it('throws AppError 422 when the request has already been actioned', async () => {
    mockRequestRepo.findOne.mockResolvedValue({
      id: 'r1',
      status: RequestStatus.APPROVED,
      user: { id: 'u1' },
    });

    await expect(
      updateRequest({ requestId: 'r1', status: RequestStatus.REJECTED }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'INVALID_STATUS_TRANSITION',
    });
  });
});
