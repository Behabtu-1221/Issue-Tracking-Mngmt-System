import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import featureFlagController from '../controllers/featureFlag.controller.js';
import {
  featureFlagCodeParamSchema,
  featureFlagCreateSchema,
  featureFlagIdParamSchema,
  featureFlagListSchema,
  featureFlagToggleSchema,
  featureFlagUpdateSchema
} from '../validators/featureFlag.validator.js';

const router = Router();

router.get('/feature-flags', validate(featureFlagListSchema, 'query'), featureFlagController.list);
router.get('/feature-flags/code/:code', validate(featureFlagCodeParamSchema, 'params'), featureFlagController.getByCode);
router.get('/feature-flags/code/:code/enabled', validate(featureFlagCodeParamSchema, 'params'), featureFlagController.checkEnabled);
router.get('/feature-flags/:id', validate(featureFlagIdParamSchema, 'params'), featureFlagController.getById);
router.post('/feature-flags', validate(featureFlagCreateSchema), featureFlagController.create);
router.put('/feature-flags/:id', validate(featureFlagIdParamSchema, 'params'), validate(featureFlagUpdateSchema), featureFlagController.update);
router.patch('/feature-flags/:id/toggle', validate(featureFlagIdParamSchema, 'params'), validate(featureFlagToggleSchema), featureFlagController.toggle);
router.delete('/feature-flags/:id', validate(featureFlagIdParamSchema, 'params'), featureFlagController.remove);

export default router;
