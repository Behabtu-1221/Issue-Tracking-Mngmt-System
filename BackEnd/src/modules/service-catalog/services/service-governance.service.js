import serviceGovernanceRepository from '../repositories/service-governance.repository.js';
import serviceRepository from '../repositories/service.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const serviceGovernanceService = {
  // Visibility
  async getVisibilityByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    return serviceGovernanceRepository.findVisibilityByServiceId(serviceId);
  },

  async createVisibility(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }
    const newId = await serviceGovernanceRepository.createVisibility({ ...data, CreatedBy: userId });
    return { id: newId, message: 'Service visibility rule added successfully' };
  },

  async deleteVisibility(id, userId) {
    await serviceGovernanceRepository.deleteVisibility(id, userId);
    return { message: 'Service visibility rule removed successfully' };
  },

  // Service Departments
  async getDepartmentsByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    return serviceGovernanceRepository.findDepartmentsByServiceId(serviceId);
  },

  async createServiceDepartment(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }
    try {
      const newId = await serviceGovernanceRepository.createServiceDepartment({ ...data, CreatedBy: userId });
      return { id: newId, message: 'Department assigned to service successfully' };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError('This department is already assigned to this service', 409);
      }
      throw err;
    }
  },

  async deleteServiceDepartment(id, userId) {
    await serviceGovernanceRepository.deleteServiceDepartment(id, userId);
    return { message: 'Department unassigned from service successfully' };
  },

  // Service SLA
  async getSLAByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    return serviceGovernanceRepository.findSLAByServiceId(serviceId);
  },

  async upsertSLA(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }
    return serviceGovernanceRepository.upsertSLA({ ...data, CreatedBy: userId });
  },

  async deleteSLA(id, userId) {
    await serviceGovernanceRepository.deleteSLA(id, userId);
    return { message: 'Service SLA policy link removed successfully' };
  },

  // Approval Rules
  async getApprovalRulesByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    return serviceGovernanceRepository.findApprovalRulesByServiceId(serviceId);
  },

  async createApprovalRule(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }
    const newId = await serviceGovernanceRepository.createApprovalRule({ ...data, CreatedBy: userId });
    return { id: newId, message: 'Service approval rule created successfully' };
  },

  async deleteApprovalRule(id, userId) {
    await serviceGovernanceRepository.deleteApprovalRule(id, userId);
    return { message: 'Service approval rule deleted successfully' };
  }
};

export default serviceGovernanceService;
