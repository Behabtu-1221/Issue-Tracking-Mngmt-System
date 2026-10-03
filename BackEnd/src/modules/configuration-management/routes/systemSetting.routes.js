import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import systemSettingController from '../controllers/systemSetting.controller.js';
import {
  settingIdParamSchema,
  settingKeyParamSchema,
  systemSettingCreateSchema,
  systemSettingListSchema,
  systemSettingUpdateSchema
} from '../validators/systemSetting.validator.js';

const router = Router();

router.get('/system-settings', validate(systemSettingListSchema, 'query'), systemSettingController.list);
router.get('/system-settings/key/:key', validate(settingKeyParamSchema, 'params'), systemSettingController.getByKey);
router.get('/system-settings/:id', validate(settingIdParamSchema, 'params'), systemSettingController.getById);
router.post('/system-settings', validate(systemSettingCreateSchema), systemSettingController.create);
router.put(
  '/system-settings/:id',
  validate(settingIdParamSchema, 'params'),
  validate(systemSettingUpdateSchema),
  systemSettingController.update
);
router.delete('/system-settings/:id', validate(settingIdParamSchema, 'params'), systemSettingController.remove);

export default router;
