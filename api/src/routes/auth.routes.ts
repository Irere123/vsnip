import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller';
import { isAuth } from '../auth';

const router = Router();

router.get('/google', authController.googleLogin);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login-error',
  }),
  authController.googleCallback,
);
router.get('/me', isAuth(false), authController.getMe);

export default router;
