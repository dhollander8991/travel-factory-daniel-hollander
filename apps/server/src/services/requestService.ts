import { AppDataSource } from '../config/database';
import { VacationRequest } from '../entities/VacationRequest';
import { User } from '../entities/User';
import { RequestStatus } from '@org/shared';
import { AppError } from '../middleware/errorHandler';

const getRequestRepo = () => AppDataSource.getRepository(VacationRequest);
const getUserRepo = () => AppDataSource.getRepository(User);

// ─────────────────────────────────────────────
// GET ALL REQUESTS (validator view)
// ─────────────────────────────────────────────

interface GetAllRequestsParams {
  status?: RequestStatus;
}

/**
 * Returns all vacation requests, optionally filtered by status
 * @param params.status - Optional status filter (Pending/Approved/Rejected)
 * @returns Array of vacation requests with user data
 */
export const getAllRequests = async ({ status }: GetAllRequestsParams) => {
  const repo = getRequestRepo();

  // createQueryBuilder lets us build the query dynamically
  // 'request' is the alias we use to reference the entity in the query
  const qb = repo
    .createQueryBuilder('request')
    // leftJoinAndSelect loads the related user data in the same query
    // Without this request.user would be undefined
    // This is one JOIN — not the N+1 problem
    .leftJoinAndSelect('request.user', 'user')
    .orderBy('request.createdAt', 'DESC');

  // Only add the WHERE clause if status was provided
  // If no status filter, return all requests
  if (status) {
    qb.where('request.status = :status', { status });
  }

  const [requests, total] = await qb.getManyAndCount();

  // getManyAndCount() returns both the results and the total count
  // in a single query — more efficient than two separate queries
  return { requests, total };
};

// ─────────────────────────────────────────────
// GET REQUESTS BY USER (requester view)
// ─────────────────────────────────────────────

interface GetUserRequestsParams {
  userId: string;
  status?: RequestStatus;
}

/**
 * Returns all vacation requests for a specific user
 * @param params.userId - The user's ID
 * @param params.status - Optional status filter
 * @returns Array of the user's vacation requests
 */
export const getUserRequests = async ({ userId, status }: GetUserRequestsParams) => {
  const repo = getRequestRepo();

  const qb = repo
    .createQueryBuilder('request')
    .leftJoinAndSelect('request.user', 'user')
    // Always filter by userId — requester can only see their own requests
    .where('user.id = :userId', { userId })
    .orderBy('request.createdAt', 'DESC');

  if (status) {
    // andWhere adds an additional condition — doesn't replace the existing WHERE
    qb.andWhere('request.status = :status', { status });
  }

  const [requests, total] = await qb.getManyAndCount();
  return { requests, total };
};

// ─────────────────────────────────────────────
// CREATE REQUEST
// ─────────────────────────────────────────────

interface CreateRequestParams {
  userId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

/**
 * Creates a new vacation request after checking for date conflicts
 * @param params.userId - The requesting user's ID
 * @param params.startDate - Start date in YYYY-MM-DD format
 * @param params.endDate - End date in YYYY-MM-DD format
 * @param params.reason - Optional reason for the request
 * @returns The created vacation request
 */
export const createRequest = async ({
                                      userId,
                                      startDate,
                                      endDate,
                                      reason,
                                    }: CreateRequestParams) => {
  const userRepo = getUserRepo();
  const requestRepo = getRequestRepo();

  // Verify the user exists before creating a request
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Check for date conflicts before inserting
  // This query catches all four overlap patterns:
  // 1. New request starts inside existing
  // 2. New request ends inside existing
  // 3. New request completely contains existing
  // 4. New request is completely inside existing
  // The single condition startDate <= newEnd AND endDate >= newStart covers all four
  const conflict = await requestRepo
    .createQueryBuilder('request')
    .where('request.user_id = :userId', { userId })
    // Only check against non-rejected requests
    // A rejected request no longer blocks dates
    .andWhere('request.status != :rejected', {
      rejected: RequestStatus.REJECTED,
    })
    .andWhere('request.startDate <= :endDate', { endDate })
    .andWhere('request.endDate >= :startDate', { startDate })
    .getOne();

  if (conflict) {
    throw new AppError(
      409,
      `Your request conflicts with an existing ${conflict.status.toLowerCase()} request from ${conflict.startDate} to ${conflict.endDate}`,
      'DATE_CONFLICT',
      'startDate'
    );
  }

  // Create and save the new request
  const request = requestRepo.create({
    user,
    startDate,
    endDate,
    // undefined reason becomes null in the DB
    reason: reason || null,
    status: RequestStatus.PENDING,
  });

  return requestRepo.save(request);
};

// ─────────────────────────────────────────────
// UPDATE REQUEST (approve or reject)
// ─────────────────────────────────────────────

interface UpdateRequestParams {
  requestId: string;
  status: RequestStatus.APPROVED | RequestStatus.REJECTED;
  comments?: string;
}

/**
 * Approves or rejects a vacation request
 * @param params.requestId - The request's ID
 * @param params.status - New status (Approved or Rejected only)
 * @param params.comments - Required when rejecting
 * @returns The updated vacation request
 */
export const updateRequest = async ({
                                      requestId,
                                      status,
                                      comments,
                                    }: UpdateRequestParams) => {
  const repo = getRequestRepo();

  // Find the request — include user data for the response
  const request = await repo.findOne({
    where: { id: requestId },
    relations: { user: true },
  });

  if (!request) {
    throw new AppError(404, 'Request not found', 'REQUEST_NOT_FOUND');
  }

  // Guard — only Pending requests can be actioned
  // Prevents approving an already approved request
  // or rejecting an already rejected request
  if (request.status !== RequestStatus.PENDING) {
    throw new AppError(
      422,
      `This request has already been ${request.status.toLowerCase()}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Update the status and comments
  request.status = status;
  // Only set comments if provided — keeps null for approvals
  request.comments = comments || null;

  return repo.save(request);
};