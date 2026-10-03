import { Router } from 'express';
import serviceRequirementController from '../controllers/service-requirement.controller.js';
import validate from '../../../shared/middleware/validate.js';
import {
  createServiceRequirementSchema,
  updateServiceRequirementSchema,
  createServiceAttachmentSchema,
  updateServiceAttachmentSchema
} from '../validators/service-catalog.validator.js';

const router = Router();

// Form Fields
router.get('/fields/service/:serviceId', serviceRequirementController.getRequirementsByServiceId);
router.post('/fields', validate(createServiceRequirementSchema), serviceRequirementController.createRequirement);
router.put('/fields/:id', validate(updateServiceRequirementSchema), serviceRequirementController.updateRequirement);
router.delete('/fields/:id', serviceRequirementController.deleteRequirement);

// Attachments
router.get('/attachments/service/:serviceId', serviceRequirementController.getAttachmentsByServiceId);
router.post('/attachments', validate(createServiceAttachmentSchema), serviceRequirementController.createAttachment);
router.put('/attachments/:id', validate(updateServiceAttachmentSchema), serviceRequirementController.updateAttachment);
router.delete('/attachments/:id', serviceRequirementController.deleteAttachment);

export default router;
