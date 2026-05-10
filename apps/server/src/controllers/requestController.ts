import { Request, Response, NextFunction } from 'express';
import * as requestService from '../services/requestService';
import { RequestStatus } from '@org/shared';

/**
 * GET /api/v1/requests
 * Returns all requests — validator view
 * Optional query param: ?status=Pending
 */
export const getAllRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.query contains URL query parameters
    // e.g. /api/v1/requests?status=Pending → req.query.status = 'Pending'
    const status = req.query.status as RequestStatus | undefined;
    const result = await requestService.getAllRequests({ status });
    res.status(200).json({ data: result.requests, total: result.total });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id/requests
 * Returns requests for a specific user — requester view
 */
export const getUserRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.params contains URL path parameters
    // e.g. /api/v1/users/1/requests → req.params.id = '1'
    // parseInt converts the string '1' to number 1
    const userId = req.params.id;
    const status = req.query.status as RequestStatus | undefined;
    const result = await requestService.getUserRequests({ userId, status });
    res.status(200).json({ data: result.requests, total: result.total });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/requests
 * Creates a new vacation request
 */
export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, startDate, endDate, reason } = req.body;
    const request = await requestService.createRequest({
      userId,
      startDate,
      endDate,
      reason,
    });
    res.status(201).json({ data: request });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/requests/:id
 * Approves or rejects a request
 */
export const updateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestId = req.params.id;
    const { status, comments } = req.body;
    const request = await requestService.updateRequest({
      requestId,
      status,
      comments,
    });
    res.status(200).json({ data: request });
  } catch (error) {
    next(error);
  }
};