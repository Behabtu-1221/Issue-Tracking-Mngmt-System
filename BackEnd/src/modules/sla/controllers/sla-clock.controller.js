import slaClockService from '../services/sla-clock.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const slaClockController = {
  async getOverviewMetrics(req, res, next) {
    try {
      const data = await slaClockService.getOverviewMetrics(req.query.tenantId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async findAllClocks(req, res, next) {
    try {
      const data = await slaClockService.findAllClocks({
        search: req.query.search,
        clockStatus: req.query.clockStatus,
        priorityCode: req.query.priorityCode,
        isBreached: req.query.isBreached === 'true',
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50)
      });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async findClockById(req, res, next) {
    try {
      const data = await slaClockService.findClockById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async startClock(req, res, next) {
    try {
      const data = await slaClockService.startClockForIssue(
        req.body.IssueRequestID,
        req.body.SLAPolicyID || 1,
        req.body.PriorityCode || 'MEDIUM',
        req.user?.id || 1
      );
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async pauseClock(req, res, next) {
    try {
      const data = await slaClockService.pauseClock(req.params.id, req.body.pauseReason, req.user?.id || 1);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async resumeClock(req, res, next) {
    try {
      const data = await slaClockService.resumeClock(req.params.id, req.user?.id || 1);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async findAllBreaches(req, res, next) {
    try {
      const data = await slaClockService.findAllBreaches({
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50)
      });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async acknowledgeBreach(req, res, next) {
    try {
      const data = await slaClockService.acknowledgeBreach(req.params.id, req.user?.id || 1);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
};

export default slaClockController;
