import budgetCostCenterRepository from '../repositories/budget-cost-center.repository.js';
import departmentRepository from '../repositories/department.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const budgetCostCenterService = {
  // Cost Centers
  async getCostCenters(params) {
    return budgetCostCenterRepository.findAllCostCenters(params);
  },

  async getCostCenterById(id) {
    const cc = await budgetCostCenterRepository.findCostCenterById(id);
    if (!cc) {
      throw new AppError(`Cost center with ID ${id} not found`, 404);
    }
    return cc;
  },

  async createCostCenter(data, userId) {
    const existing = await budgetCostCenterRepository.findCostCenterByCode(data.TenantID, data.CostCenterCode);
    if (existing) {
      throw new AppError(`Cost center code '${data.CostCenterCode}' already exists`, 409);
    }

    const newId = await budgetCostCenterRepository.createCostCenter({ ...data, CreatedBy: userId });
    return budgetCostCenterRepository.findCostCenterById(newId);
  },

  async updateCostCenter(id, data, userId) {
    const cc = await budgetCostCenterRepository.findCostCenterById(id);
    if (!cc) {
      throw new AppError(`Cost center with ID ${id} not found`, 404);
    }

    return budgetCostCenterRepository.updateCostCenter(id, { ...data, ModifiedBy: userId });
  },

  async deleteCostCenter(id, userId) {
    const cc = await budgetCostCenterRepository.findCostCenterById(id);
    if (!cc) {
      throw new AppError(`Cost center with ID ${id} not found`, 404);
    }

    await budgetCostCenterRepository.deleteCostCenter(id, userId);
    return { message: `Cost center '${cc.CostCenterName}' deleted successfully` };
  },

  // Department Budgets
  async getBudgets(params) {
    return budgetCostCenterRepository.findAllBudgets(params);
  },

  async getBudgetById(id) {
    const budget = await budgetCostCenterRepository.findBudgetById(id);
    if (!budget) {
      throw new AppError(`Department budget with ID ${id} not found`, 404);
    }
    return budget;
  },

  async createBudget(data, userId) {
    // Validate Department
    const dept = await departmentRepository.findById(data.DepartmentID);
    if (!dept) {
      throw new AppError(`Department with ID ${data.DepartmentID} not found`, 404);
    }

    // Unique (DepartmentID, FiscalYear)
    const existing = await budgetCostCenterRepository.findBudgetByDeptAndYear(data.DepartmentID, data.FiscalYear);
    if (existing) {
      throw new AppError(
        `Budget for department '${dept.DepartmentName}' in fiscal year ${data.FiscalYear} already exists`,
        409
      );
    }

    if (data.AllocatedAmount <= 0) {
      throw new AppError('Budget allocated amount must be greater than zero', 400);
    }

    const newId = await budgetCostCenterRepository.createBudget({ ...data, CreatedBy: userId });
    return budgetCostCenterRepository.findBudgetById(newId);
  },

  async updateBudget(id, data, userId) {
    const budget = await budgetCostCenterRepository.findBudgetById(id);
    if (!budget) {
      throw new AppError(`Department budget with ID ${id} not found`, 404);
    }

    return budgetCostCenterRepository.updateBudget(id, { ...data, ModifiedBy: userId });
  },

  async deleteBudget(id, userId) {
    const budget = await budgetCostCenterRepository.findBudgetById(id);
    if (!budget) {
      throw new AppError(`Department budget with ID ${id} not found`, 404);
    }

    await budgetCostCenterRepository.deleteBudget(id, userId);
    return { message: `Budget for fiscal year ${budget.FiscalYear} deleted successfully` };
  }
};

export default budgetCostCenterService;
