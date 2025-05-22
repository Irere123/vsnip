import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller';
import { isAuth } from '../auth';

const router = Router();

router.get('/:cursor?', isAuth(), conversationController.getConversations);
router.post('/', isAuth(), conversationController.createConversation);

export default router;
