import officeAllocationService from '../services/office-allocation.service.js';
import { CreateOfficeAllocationDTO, ReleaseAllocationDTO } from '../dtos/office-allocation.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor?.userTypeCode || '').toUpperCase();
  const role = (actor?.role || actor?.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor?.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor?.tenantId && (actor?.userId === 1 || code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const officeAllocationController = {
  async getAllocations(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await officeAllocationService.getAllocations(queryParams, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAllocationById(req, res, next) {
    try {
      const { id } = getParams(req);
      const allocation = await officeAllocationService.getAllocationById(id, req.actor);
      sendSuccess(res, allocation);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await officeAllocationService.getHistory(queryParams, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async allocateOffice(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can allocate office space', 403);
      }
      const actorId = req.actor?.userId || 1;
      const dto = new CreateOfficeAllocationDTO(req.body);
      const allocation = await officeAllocationService.allocateOffice(dto, actorId);
      sendCreated(res, allocation);
    } catch (err) {
      next(err);
    }
  },

  async releaseAllocation(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can release office allocations', 403);
      }
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const dto = new ReleaseAllocationDTO(req.body);
      const allocation = await officeAllocationService.releaseAllocation(id, dto.Remarks, actorId, req.actor);
      sendSuccess(res, allocation);
    } catch (err) {
      next(err);
    }
  },

  async deleteAllocation(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can delete office allocations', 403);
      }
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await officeAllocationService.deleteAllocation(id, actorId, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default officeAllocationController;
