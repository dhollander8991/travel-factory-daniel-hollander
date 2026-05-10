import { Router } from 'express';
import * as requestController from '../controllers/requestController';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { createRequestSchema, updateRequestSchema } from '../middleware/schemas';
import { UserRole } from '@org/shared';

const router = Router();

// Full paths — mounted at root '/' in main.ts
// so paths must include /requests prefix
router.get(
  '/requests',
  requireAuth,
  requireRole(UserRole.VALIDATOR),
  requestController.getAllRequests
);

router.get(
  '/users/:id/requests',
  requireAuth,
  requireRole(UserRole.REQUESTER),
  requestController.getUserRequests
);

router.post(
  '/requests',
  requireAuth,
  requireRole(UserRole.REQUESTER),
  validate(createRequestSchema),
  requestController.createRequest
);

router.patch(
  '/requests/:id',
  requireAuth,
  requireRole(UserRole.VALIDATOR),
  validate(updateRequestSchema),
  requestController.updateRequest
);

export default router;