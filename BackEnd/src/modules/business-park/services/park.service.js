import parkRepository from '../repositories/park.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { CreateBusinessParkDTO, UpdateBusinessParkDTO } from '../dtos/park.dto.js';

export const parkService = {
  async getParks(params) {
    return parkRepository.findAll(params);
  },

  async getParkById(id) {
    const park = await parkRepository.findById(id);
    if (!park) {
      throw new AppError(`Business Park with ID ${id} not found`, 404);
    }
    return park;
  },

  async createPark(parkData, userId) {
    // Business rule: The system strictly supports only ONE business park campus (Ethiopian IT Park)
    const existingParks = await parkRepository.findAll({ limit: 1 });
    if (existingParks.total > 0 || (existingParks.parks && existingParks.parks.length > 0)) {
      throw new AppError(
        'Business Rule Violation: Only one business park campus is permitted in this system (Ethiopian IT Park). Creating additional campuses is prohibited.',
        400
      );
    }

    const dto = new CreateBusinessParkDTO(parkData);

    const existing = await parkRepository.findByCode(dto.BusinessParkCode);
    if (existing) {
      throw new AppError(`Business Park code '${dto.BusinessParkCode}' already exists`, 409);
    }

    const newId = await parkRepository.create({ ...dto, CreatedBy: userId });
    return parkRepository.findById(newId);
  },

  async updatePark(id, parkData, userId) {
    const park = await parkRepository.findById(id);
    if (!park) {
      throw new AppError(`Business Park with ID ${id} not found`, 404);
    }

    const dto = new UpdateBusinessParkDTO(parkData);
    return parkRepository.update(id, { ...dto, ModifiedBy: userId });
  },

  async deletePark(id, userId) {
    const park = await parkRepository.findById(id);
    if (!park) {
      throw new AppError(`Business Park with ID ${id} not found`, 404);
    }

    // Business rule: The sole Ethiopian IT Park campus cannot be decommissioned
    if (
      park.BusinessParkName?.toLowerCase().includes('ethiopian it park') ||
      park.BusinessParkCode === 'ICT_PARK_AA' ||
      park.BusinessParkCode === 'EITP'
    ) {
      throw new AppError(
        'Business Rule Violation: "Ethiopian IT Park" is the permanent sole business park campus and cannot be deleted.',
        400
      );
    }

    // Safe Delete: verify no active zones or buildings depend on this park
    const { zones, buildings } = await parkRepository.countActiveChildren(id);
    if (zones > 0 || buildings > 0) {
      throw new AppError(
        `Cannot delete Business Park '${park.BusinessParkName}' because active resources still depend on it (${zones} facility zone(s), ${buildings} building(s)). Remove child resources first.`,
        409
      );
    }

    await parkRepository.softDelete(id, userId);
    return { message: `Business Park '${park.BusinessParkName}' deleted successfully` };
  },

  async getOverviewMetrics(parkId) {
    return parkRepository.getOverviewMetrics(parkId);
  }
};

export default parkService;
