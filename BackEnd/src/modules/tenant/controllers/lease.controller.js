import leaseService from '../services/lease.service.js';
import { CreateLeaseDTO, UpdateLeaseDTO, UpdateLeaseStatusDTO } from '../dtos/lease.dto.js';
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

export const leaseController = {
  async getLeases(req, res, next) {
    try {
      const queryParams = getQuery(req);
      if (!isParkAdminActor(req.actor) && req.actor?.tenantId) {
        queryParams.tenantId = req.actor.tenantId;
      }
      const result = await leaseService.getLeases(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getLeaseById(req, res, next) {
    try {
      const { id } = getParams(req);
      const lease = await leaseService.getLeaseById(id);
      if (!isParkAdminActor(req.actor) && req.actor?.tenantId && Number(lease?.TenantID) !== Number(req.actor.tenantId)) {
        throw new AppError(`Lease agreement with ID ${id} not found`, 404);
      }
      sendSuccess(res, lease);
    } catch (err) {
      next(err);
    }
  },

  async getExpiringSoon(req, res, next) {
    try {
      const { days } = getQuery(req);
      const leases = await leaseService.getExpiringSoon(days);
      const scoped = !isParkAdminActor(req.actor) && req.actor?.tenantId
        ? (leases || []).filter(l => Number(l.TenantID) === Number(req.actor.tenantId))
        : leases;
      sendSuccess(res, scoped);
    } catch (err) {
      next(err);
    }
  },

  async createLease(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can manage lease contracts', 403);
      }
      const actorId = req.actor?.userId || 1;
      const dto = new CreateLeaseDTO(req.body);
      const lease = await leaseService.createLease(dto, actorId);
      sendCreated(res, lease);
    } catch (err) {
      next(err);
    }
  },

  async updateLease(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can manage lease contracts', 403);
      }
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const dto = new UpdateLeaseDTO(req.body);
      const lease = await leaseService.updateLease(id, dto, actorId);
      sendSuccess(res, lease);
    } catch (err) {
      next(err);
    }
  },

  async updateLeaseStatus(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can manage lease contracts', 403);
      }
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const dto = new UpdateLeaseStatusDTO(req.body);
      const lease = await leaseService.updateLeaseStatus(id, dto.Status, dto.TerminationReason, actorId);
      sendSuccess(res, lease);
    } catch (err) {
      next(err);
    }
  },

  async deleteLease(req, res, next) {
    try {
      if (!isParkAdminActor(req.actor)) {
        throw new AppError('Permission denied: Only Business Park Administrators can manage lease contracts', 403);
      }
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await leaseService.deleteLease(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default leaseController;
