import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import numberSequenceController from '../controllers/numberSequence.controller.js';
import {
  numberSequenceCodeParamSchema,
  numberSequenceCreateSchema,
  numberSequenceIdParamSchema,
  numberSequenceListSchema,
  numberSequenceUpdateSchema
} from '../validators/numberSequence.validator.js';

const router = Router();

router.get('/number-sequences', validate(numberSequenceListSchema, 'query'), numberSequenceController.list);
router.get('/number-sequences/code/:code', validate(numberSequenceCodeParamSchema, 'params'), numberSequenceController.getByCode);
router.post('/number-sequences/code/:code/next', validate(numberSequenceCodeParamSchema, 'params'), numberSequenceController.generateNext);
router.get('/number-sequences/:id', validate(numberSequenceIdParamSchema, 'params'), numberSequenceController.getById);
router.post('/number-sequences', validate(numberSequenceCreateSchema), numberSequenceController.create);
router.put('/number-sequences/:id', validate(numberSequenceIdParamSchema, 'params'), validate(numberSequenceUpdateSchema), numberSequenceController.update);
router.delete('/number-sequences/:id', validate(numberSequenceIdParamSchema, 'params'), numberSequenceController.remove);

export default router;
