import { Router } from 'express';
import { API_BASE_PATH, MODULE_NAME } from './constants/configuration.constants.js';
import authenticate from '../../shared/middleware/authenticate.js';
import dataScope from '../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../shared/middleware/authorize.js';
import lookupRoutes from './routes/lookup.routes.js';
import lookupTypeRoutes from './routes/lookupType.routes.js';
import systemSettingRoutes from './routes/systemSetting.routes.js';
import featureFlagRoutes from './routes/featureFlag.routes.js';
import businessRuleRoutes from './routes/businessRule.routes.js';
import numberSequenceRoutes from './routes/numberSequence.routes.js';
import localizationRoutes from './routes/localization.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import bootstrapRoutes from './routes/bootstrap.routes.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

// Strictly restrict all configuration mutations to Park Super Admins / Park Admins
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN')(req, res, next);
  }
  next();
});

router.use(lookupRoutes);
router.use(lookupTypeRoutes);
router.use(systemSettingRoutes);
router.use(featureFlagRoutes);
router.use(businessRuleRoutes);
router.use(numberSequenceRoutes);
router.use(localizationRoutes);
router.use(calendarRoutes);
router.use(bootstrapRoutes);

export default {
  name: MODULE_NAME,
  basePath: API_BASE_PATH,
  router
};
