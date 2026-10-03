import reportingHierarchyRepository from '../repositories/reporting-hierarchy.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const reportingHierarchyService = {
  async getHierarchies(params) {
    return reportingHierarchyRepository.findAll(params);
  },

  async getHierarchyById(id) {
    const hierarchy = await reportingHierarchyRepository.findById(id);
    if (!hierarchy) {
      throw new AppError(`Reporting hierarchy link with ID ${id} not found`, 404);
    }
    return hierarchy;
  },

  async createHierarchy(data, userId) {
    // Prevent self-reporting
    if (Number(data.EmployeeUserID) === Number(data.SupervisorUserID)) {
      throw new AppError('An employee cannot report to themselves', 400);
    }

    // Check for duplicate link
    const existing = await reportingHierarchyRepository.findPair(data.EmployeeUserID, data.SupervisorUserID);
    if (existing) {
      throw new AppError('This reporting hierarchy link already exists', 409);
    }

    const newId = await reportingHierarchyRepository.create({ ...data, CreatedBy: userId });
    return reportingHierarchyRepository.findById(newId);
  },

  async updateHierarchy(id, data, userId) {
    const hierarchy = await reportingHierarchyRepository.findById(id);
    if (!hierarchy) {
      throw new AppError(`Reporting hierarchy link with ID ${id} not found`, 404);
    }

    return reportingHierarchyRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteHierarchy(id, userId) {
    const hierarchy = await reportingHierarchyRepository.findById(id);
    if (!hierarchy) {
      throw new AppError(`Reporting hierarchy link with ID ${id} not found`, 404);
    }

    await reportingHierarchyRepository.softDelete(id, userId);
    return { message: `Reporting hierarchy link deleted successfully` };
  }
};

export default reportingHierarchyService;
