import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { UserRole } from '@org/shared';

const createRegisterHandler = (forcedRole: UserRole) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      // role from the request body is intentionally ignored — enforced by the route
      const user = await authService.register({ name, email, password, role: forcedRole });
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

const createLoginHandler = (requiredRole: UserRole) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password, requiredRole });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

export const registerRequester = createRegisterHandler(UserRole.REQUESTER);
export const registerValidator = createRegisterHandler(UserRole.VALIDATOR);
export const loginRequester = createLoginHandler(UserRole.REQUESTER);
export const loginValidator = createLoginHandler(UserRole.VALIDATOR);
