import { Router } from 'express';
import budgetCostCenterController from '../controllers/budget-cost-center.controller.js';
import validate from '../../../shared/middleware/validate.js';
import {
  createCostCenterSchema,
  updateCostCenterSchema,
  createDepartmentBudgetSchema,
  updateDepartmentBudgetSchema
} from '../validators/organization.validator.js';

const router = Router();

// Cost Centers
router.get('/cost-centers', budgetCostCenterController.getCostCenters);
router.get('/cost-centers/:id', budgetCostCenterController.getCostCenterById);
router.post('/cost-centers', validate(createCostCenterSchema), budgetCostCenterController.createCostCenter);
router.put('/cost-centers/:id', validate(updateCostCenterSchema), budgetCostCenterController.updateCostCenter);
router.delete('/cost-centers/:id', budgetCostCenterController.deleteCostCenter);

// Department Budgets
router.get('/budgets', budgetCostCenterController.getBudgets);
router.get('/budgets/:id', budgetCostCenterController.getBudgetById);
router.post('/budgets', validate(createDepartmentBudgetSchema), budgetCostCenterController.createBudget);
router.put('/budgets/:id', validate(updateDepartmentBudgetSchema), budgetCostCenterController.updateBudget);
router.delete('/budgets/:id', budgetCostCenterController.deleteBudget);

export default router;
