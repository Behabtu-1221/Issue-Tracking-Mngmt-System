import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import localizationController from '../controllers/localization.controller.js';
import {
  languageResourceCreateSchema,
  languageResourceIdParamSchema,
  languageResourceUpdateSchema,
  localizationCreateSchema,
  localizationIdParamSchema,
  localizationListSchema,
  localizationUpdateSchema
} from '../validators/localization.validator.js';

const router = Router();

router.get('/localizations', validate(localizationListSchema, 'query'), localizationController.list);
router.get('/localizations/:id', validate(localizationIdParamSchema, 'params'), localizationController.getById);
router.post('/localizations', validate(localizationCreateSchema), localizationController.create);
router.put('/localizations/:id', validate(localizationIdParamSchema, 'params'), validate(localizationUpdateSchema), localizationController.update);
router.delete('/localizations/:id', validate(localizationIdParamSchema, 'params'), localizationController.remove);

router.get('/localizations/:id/resources', validate(localizationIdParamSchema, 'params'), localizationController.listResources);
router.post('/localizations/:id/resources', validate(localizationIdParamSchema, 'params'), validate(languageResourceCreateSchema), localizationController.createResource);
router.put('/localizations/:localizationId/resources/:resourceId', validate(languageResourceIdParamSchema, 'params'), validate(languageResourceUpdateSchema), localizationController.updateResource);
router.delete('/localizations/:localizationId/resources/:resourceId', validate(languageResourceIdParamSchema, 'params'), localizationController.removeResource);

export default router;
