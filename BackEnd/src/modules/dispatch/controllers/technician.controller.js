import technicianService from '../services/technician.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const technicianController = {
  async getTechnicians(req, res, next) {
    try {
      const data = await technicianService.getTechnicians({
        tenantId: req.dataScope?.tenantId,
        departmentId: req.dataScope?.departmentId,
        search: req.query.search,
        availabilityStatus: req.query.availabilityStatus,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50)
      });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async updateAvailability(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || 1;
      const data = await technicianService.updateAvailability(userId, req.body.statusCode);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || 1;
      const data = await technicianService.updateLocation(userId, req.body.latitude, req.body.longitude);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
};

export default technicianController;
