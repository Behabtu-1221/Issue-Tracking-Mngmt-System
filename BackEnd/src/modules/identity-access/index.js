import { Router } from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import { API_BASE_PATH, MODULE_NAME } from './constants/identity.constants.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

export default {
  name: MODULE_NAME,
  basePath: API_BASE_PATH,
  router
};
