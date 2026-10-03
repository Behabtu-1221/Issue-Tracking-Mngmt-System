import { Router } from 'express';
import positionController from '../controllers/position.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createPositionSchema, updatePositionSchema } from '../validators/organization.validator.js';

const router = Router();

router.get('/', positionController.getPositions);
router.get('/:id', positionController.getPositionById);
router.post('/', validate(createPositionSchema), positionController.createPosition);
router.put('/:id', validate(updatePositionSchema), positionController.updatePosition);
router.delete('/:id', positionController.deletePosition);

export default router;
