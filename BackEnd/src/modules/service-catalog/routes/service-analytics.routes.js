import { Router } from 'express';
import serviceAnalyticsController from '../controllers/service-analytics.controller.js';

const router = Router();

router.get('/metrics', serviceAnalyticsController.getOverviewMetrics);

export default router;
