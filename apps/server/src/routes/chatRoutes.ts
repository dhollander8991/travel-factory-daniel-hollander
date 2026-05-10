import { Router } from 'express';
import { chat } from '../controllers/chatController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/chat', requireAuth, chat);

export default router;
