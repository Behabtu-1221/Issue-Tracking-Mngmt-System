import serviceAnalyticsRepository from '../repositories/service-analytics.repository.js';

export const serviceAnalyticsService = {
  async getOverviewMetrics(tenantId) {
    return serviceAnalyticsRepository.getOverviewMetrics(tenantId);
  }
};

export default serviceAnalyticsService;
