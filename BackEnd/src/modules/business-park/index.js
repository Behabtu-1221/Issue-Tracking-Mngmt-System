import { Router } from 'express';
import parkRoutes from './routes/park.routes.js';
import buildingRoutes from './routes/building.routes.js';
import floorRoutes from './routes/floor.routes.js';
import officeRoutes from './routes/office.routes.js';
import locationRoutes from './routes/location.routes.js';
import facilityZoneRoutes from './routes/facility-zone.routes.js';
import floorPlanRoutes from './routes/floor-plan.routes.js';

const router = Router();

router.use('/parks', parkRoutes);
router.use('/buildings', buildingRoutes);
router.use('/floors', floorRoutes);
router.use('/offices', officeRoutes);
router.use('/locations', locationRoutes);
router.use('/facility-zones', facilityZoneRoutes);
router.use('/floor-plans', floorPlanRoutes);

export default {
  name: 'BusinessParkModule',
  basePath: '/api',
  router
};
