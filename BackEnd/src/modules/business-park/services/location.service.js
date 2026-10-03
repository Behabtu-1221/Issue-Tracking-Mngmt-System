import locationRepository from '../repositories/location.repository.js';
import parkRepository from '../repositories/park.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const locationService = {
  async getLocations(params) {
    return locationRepository.findAll(params);
  },

  async getLocationById(id) {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw new AppError(`Location with ID ${id} not found`, 404);
    }
    return location;
  },

  async createLocation(data, userId) {
    const park = await parkRepository.findById(data.BusinessParkID);
    if (!park) {
      throw new AppError(`Business Park with ID ${data.BusinessParkID} not found`, 404);
    }

    const existing = await locationRepository.findByParkAndCode(data.BusinessParkID, data.LocationCode);
    if (existing) {
      throw new AppError(`Location code '${data.LocationCode}' already exists in this Business Park`, 409);
    }

    const newId = await locationRepository.create({ ...data, CreatedBy: userId });
    return locationRepository.findById(newId);
  },

  async updateLocation(id, data, userId) {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw new AppError(`Location with ID ${id} not found`, 404);
    }

    return locationRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteLocation(id, userId) {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw new AppError(`Location with ID ${id} not found`, 404);
    }

    await locationRepository.softDelete(id, userId);
    return { message: `Location '${location.LocationName}' deleted successfully` };
  }
};

export default locationService;
