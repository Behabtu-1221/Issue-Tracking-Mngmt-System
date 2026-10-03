import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import authController from '../controllers/auth.controller.js';
import {
  loginLimiter,
  passwordResetLimiter,
  tokenRefreshLimiter
} from '../../../shared/middleware/rateLimiter.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema
} from '../validators/auth.validator.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', tokenRefreshLimiter, validate(refreshTokenSchema), authController.refresh);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/notification-preferences', authenticate, authController.updateNotificationPreferences);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/sessions', authenticate, authController.sessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

export default router;
