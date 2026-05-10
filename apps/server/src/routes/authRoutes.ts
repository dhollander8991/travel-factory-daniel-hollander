import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../middleware/schemas';

const router = Router();

router.post('/register/requester', validate(registerSchema), authController.registerRequester);
router.post('/register/validator', validate(registerSchema), authController.registerValidator);
router.post('/login/requester', validate(loginSchema), authController.loginRequester);
router.post('/login/validator', validate(loginSchema), authController.loginValidator);

export default router;
