import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { isAuth } from '../auth';

const router = Router();

router.get('/:userId/:cursor?', isAuth(), messageController.getMessages);
router.post('/', isAuth(), messageController.createMessage);

export default router;
