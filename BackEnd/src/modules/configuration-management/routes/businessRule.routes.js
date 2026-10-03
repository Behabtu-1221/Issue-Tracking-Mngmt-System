import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import businessRuleController from '../controllers/businessRule.controller.js';
import {
  businessRuleCodeParamSchema,
  businessRuleCreateSchema,
  businessRuleIdParamSchema,
  businessRuleListSchema,
  businessRuleUpdateSchema
} from '../validators/businessRule.validator.js';

const router = Router();

router.get('/business-rules', validate(businessRuleListSchema, 'query'), businessRuleController.list);
router.get('/business-rules/code/:code', validate(businessRuleCodeParamSchema, 'params'), businessRuleController.getByCode);
router.get('/business-rules/:id', validate(businessRuleIdParamSchema, 'params'), businessRuleController.getById);
router.post('/business-rules', validate(businessRuleCreateSchema), businessRuleController.create);
router.put('/business-rules/:id', validate(businessRuleIdParamSchema, 'params'), validate(businessRuleUpdateSchema), businessRuleController.update);
router.delete('/business-rules/:id', validate(businessRuleIdParamSchema, 'params'), businessRuleController.remove);

export default router;
