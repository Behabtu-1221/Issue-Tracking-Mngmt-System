import technicianRepository from '../repositories/technician.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const technicianService = {
  async getTechnicians(params) {
    return technicianRepository.getTechnicians(params);
  },

  async updateAvailability(userId, statusCode) {
    if (!['AVAILABLE', 'BUSY', 'ON_LEAVE', 'OFFLINE'].includes(statusCode)) {
      throw new AppError('Invalid availability status code', 400);
    }
    await technicianRepository.updateAvailability(userId, statusCode);
    return { userId, statusCode };
  },

  async updateLocation(userId, latitude, longitude) {
    if (latitude === undefined || longitude === undefined) {
      throw new AppError('Latitude and Longitude are required', 400);
    }
    await technicianRepository.updateLocation(userId, latitude, longitude);
    return { userId, latitude, longitude };
  }
};

export default technicianService;
