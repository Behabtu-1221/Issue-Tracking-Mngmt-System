import serviceGovernanceService from '../services/service-governance.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams } from '../../../shared/utils/requestData.js';

export const serviceGovernanceController = {
  // Visibility
  async getVisibilityByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const list = await serviceGovernanceService.getVisibilityByServiceId(serviceId);
      sendSuccess(res, list);
    } catch (err) {
      next(err);
    }
  },

  async createVisibility(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.createVisibility(req.body, actorId);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteVisibility(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.deleteVisibility(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Service Departments
  async getDepartmentsByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const list = await serviceGovernanceService.getDepartmentsByServiceId(serviceId);
      sendSuccess(res, list);
    } catch (err) {
      next(err);
    }
  },

  async createServiceDepartment(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.createServiceDepartment(req.body, actorId);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteServiceDepartment(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.deleteServiceDepartment(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // SLA
  async getSLAByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const sla = await serviceGovernanceService.getSLAByServiceId(serviceId);
      sendSuccess(res, sla);
    } catch (err) {
      next(err);
    }
  },

  async upsertSLA(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.upsertSLA(req.body, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteSLA(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.deleteSLA(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Approval Rules
  async getApprovalRulesByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const list = await serviceGovernanceService.getApprovalRulesByServiceId(serviceId);
      sendSuccess(res, list);
    } catch (err) {
      next(err);
    }
  },

  async createApprovalRule(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.createApprovalRule(req.body, actorId);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteApprovalRule(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceGovernanceService.deleteApprovalRule(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default serviceGovernanceController;
