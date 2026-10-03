import officeService from '../services/office.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const officeController = {
  async getOffices(req, res, next) {
    try {
      const queryParams = { ...getQuery(req), ...getParams(req) };
      if (req.params.floorId) queryParams.floorId = req.params.floorId;
      if (req.params.buildingId) queryParams.buildingId = req.params.buildingId;
      const result = await officeService.getOffices(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getOfficeById(req, res, next) {
    try {
      const { id } = getParams(req);
      const office = await officeService.getOfficeById(id);
      sendSuccess(res, office);
    } catch (err) {
      next(err);
    }
  },

  async createOffice(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const payload = { ...req.body };
      if (req.params.floorId) payload.FloorID = req.params.floorId;
      const office = await officeService.createOffice(payload, actorId);
      sendCreated(res, office);
    } catch (err) {
      next(err);
    }
  },

  async updateOffice(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const office = await officeService.updateOffice(id, req.body, actorId);
      sendSuccess(res, office);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = getParams(req);
      const { status } = req.body;
      const actorId = req.actor?.userId || 1;
      const office = await officeService.updateStatus(id, status, actorId);
      sendSuccess(res, office);
    } catch (err) {
      next(err);
    }
  },

  async deleteOffice(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await officeService.deleteOffice(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default officeController;
