import serviceAnalyticsService from '../services/service-analytics.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const serviceAnalyticsController = {
  async getOverviewMetrics(req, res, next) {
    try {
      const tenantId = req.user?.TenantID || null;
      const metrics = await serviceAnalyticsService.getOverviewMetrics(tenantId);
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }
};

export default serviceAnalyticsController;
