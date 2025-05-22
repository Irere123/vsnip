import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { isAuth } from '../auth';
import { config } from '../config';

const router = Router();

router.get('/feed', isAuth(), userController.getFeed);
router.put('/current', isAuth(), userController.updateUser);
router.get('/:id', isAuth(), userController.getUserById);

if (!config.prod) {
  router.post('/dev', userController.devCreateUser);
}

export default router;
