import { Router } from 'express';
import reportingRoutes from './routes/reporting.routes.js';

const router = Router();

router.use('/', reportingRoutes);

export default {
  name: 'ReportingModule',
  basePath: '/api/reports',
  router
};
