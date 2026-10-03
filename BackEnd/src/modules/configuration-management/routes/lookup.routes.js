import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import lookupController from '../controllers/lookup.controller.js';
import {
  buildCreateSchema,
  buildUpdateSchema,
  codeParamSchema,
  entityKeyParamSchema,
  idParamSchema,
  listQuerySchema
} from '../validators/lookup.validator.js';
import AppError from '../../../shared/errors/AppError.js';
import { getEntityConfig } from '../constants/lookupEntities.js';

const router = Router();

const ensureEntity = (req, res, next) => {
  if (!getEntityConfig(req.params.entityKey)) {
    return next(new AppError(`Unknown lookup entity: ${req.params.entityKey}`, 404));
  }
  return next();
};

const validateCreateBody = (req, res, next) => {
  const schema = buildCreateSchema(req.params.entityKey);
  return validate(schema)(req, res, next);
};

const validateUpdateBody = (req, res, next) => {
  const schema = buildUpdateSchema(req.params.entityKey);
  return validate(schema)(req, res, next);
};

router.get(
  '/lookups/:entityKey',
  validate(entityKeyParamSchema, 'params'),
  ensureEntity,
  validate(listQuerySchema, 'query'),
  lookupController.list
);

router.get(
  '/lookups/:entityKey/code/:code',
  validate(codeParamSchema, 'params'),
  ensureEntity,
  lookupController.getByCode
);

router.get(
  '/lookups/:entityKey/:id',
  validate(idParamSchema, 'params'),
  ensureEntity,
  lookupController.getById
);

router.post(
  '/lookups/:entityKey',
  validate(entityKeyParamSchema, 'params'),
  ensureEntity,
  validateCreateBody,
  lookupController.create
);

router.put(
  '/lookups/:entityKey/:id',
  validate(idParamSchema, 'params'),
  ensureEntity,
  validateUpdateBody,
  lookupController.update
);

router.delete(
  '/lookups/:entityKey/:id',
  validate(idParamSchema, 'params'),
  ensureEntity,
  lookupController.remove
);

export default router;
