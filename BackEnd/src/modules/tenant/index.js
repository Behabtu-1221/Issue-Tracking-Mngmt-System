import { Router } from 'express';
import tenantRoutes from './routes/tenant.routes.js';
import subTenantRoutes from './routes/sub-tenant.routes.js';
import tenantContactRoutes from './routes/tenant-contact.routes.js';
import tenantAddressRoutes from './routes/tenant-address.routes.js';
import leaseRoutes from './routes/lease.routes.js';
import officeAllocationRoutes from './routes/office-allocation.routes.js';

const router = Router();

router.use('/tenants', tenantRoutes);
router.use('/sub-tenants', subTenantRoutes);
router.use('/tenant-contacts', tenantContactRoutes);
router.use('/tenant-addresses', tenantAddressRoutes);
router.use('/leases', leaseRoutes);
router.use('/office-allocations', officeAllocationRoutes);

export default {
  name: 'TenantManagementModule',
  basePath: '/api',
  router
};
