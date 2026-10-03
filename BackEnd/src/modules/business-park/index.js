import { Router } from 'express';
import authenticate from '../../shared/middleware/authenticate.js';
import dataScope from '../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../shared/middleware/authorize.js';
import parkRoutes from './routes/park.routes.js';
import buildingRoutes from './routes/building.routes.js';
import floorRoutes from './routes/floor.routes.js';
import officeRoutes from './routes/office.routes.js';
import locationRoutes from './routes/location.routes.js';
import facilityZoneRoutes from './routes/facility-zone.routes.js';
import floorPlanRoutes from './routes/floor-plan.routes.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

const adminMutationGuard = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN')(req, res, next);
  }
  next();
};

router.use('/parks', adminMutationGuard, parkRoutes);
router.use('/buildings', adminMutationGuard, buildingRoutes);
router.use('/floors', adminMutationGuard, floorRoutes);
router.use('/offices', adminMutationGuard, officeRoutes);
router.use('/locations', adminMutationGuard, locationRoutes);
router.use('/facility-zones', adminMutationGuard, facilityZoneRoutes);
router.use('/floor-plans', adminMutationGuard, floorPlanRoutes);

export default {
  name: 'BusinessParkModule',
  basePath: '/api',
  router
};
