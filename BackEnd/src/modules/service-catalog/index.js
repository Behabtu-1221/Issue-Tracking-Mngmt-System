import { Router } from 'express';
import serviceCategoryRoutes from './routes/service-category.routes.js';
import serviceRoutes from './routes/service.routes.js';
import servicePricingRoutes from './routes/service-pricing.routes.js';
import serviceRequirementRoutes from './routes/service-requirement.routes.js';
import serviceGovernanceRoutes from './routes/service-governance.routes.js';
import serviceAnalyticsRoutes from './routes/service-analytics.routes.js';
import serviceCategoryMappingRoutes from './routes/service-category-mapping.routes.js';

const router = Router();

router.use('/service-categories', serviceCategoryRoutes);
router.use('/services', serviceRoutes);
router.use('/service-pricings', servicePricingRoutes);
router.use('/service-pricing', servicePricingRoutes);
router.use('/service-requirements', serviceRequirementRoutes);
router.use('/service-governance', serviceGovernanceRoutes);
router.use('/service-analytics', serviceAnalyticsRoutes);
router.use('/category-mappings', serviceCategoryMappingRoutes);

export default {
  name: 'ServiceCatalogModule',
  basePath: '/api',
  router
};
