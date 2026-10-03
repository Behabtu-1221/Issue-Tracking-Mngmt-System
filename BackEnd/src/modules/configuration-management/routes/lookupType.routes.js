import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import { listQuerySchema } from '../validators/lookup.validator.js';
import lookupTypeController from '../controllers/lookupType.controller.js';
import {
  lookupTypeCodeParamSchema,
  lookupTypeCreateSchema,
  lookupTypeIdParamSchema,
  lookupTypeUpdateSchema,
  lookupValueCreateSchema,
  lookupValueIdParamSchema,
  lookupValueUpdateSchema
} from '../validators/lookupType.validator.js';

const router = Router();

router.get('/lookup-types', validate(listQuerySchema, 'query'), lookupTypeController.list);

router.get(
  '/lookup-types/code/:code',
  validate(lookupTypeCodeParamSchema, 'params'),
  lookupTypeController.getByCode
);

router.get(
  '/lookup-types/:id',
  validate(lookupTypeIdParamSchema, 'params'),
  lookupTypeController.getById
);

router.post(
  '/lookup-types',
  validate(lookupTypeCreateSchema),
  lookupTypeController.create
);

router.put(
  '/lookup-types/:id',
  validate(lookupTypeIdParamSchema, 'params'),
  validate(lookupTypeUpdateSchema),
  lookupTypeController.update
);

router.delete(
  '/lookup-types/:id',
  validate(lookupTypeIdParamSchema, 'params'),
  lookupTypeController.remove
);

router.get(
  '/lookup-types/:id/values',
  validate(lookupTypeIdParamSchema, 'params'),
  lookupTypeController.listValues
);

router.post(
  '/lookup-types/:id/values',
  validate(lookupTypeIdParamSchema, 'params'),
  validate(lookupValueCreateSchema),
  lookupTypeController.createValue
);

router.put(
  '/lookup-types/:lookupTypeId/values/:valueId',
  validate(lookupValueIdParamSchema, 'params'),
  validate(lookupValueUpdateSchema),
  lookupTypeController.updateValue
);

router.delete(
  '/lookup-types/:lookupTypeId/values/:valueId',
  validate(lookupValueIdParamSchema, 'params'),
  lookupTypeController.removeValue
);

export default router;
