import facilityZoneRepository from '../repositories/facility-zone.repository.js';
import buildingRepository from '../repositories/building.repository.js';
import parkRepository from '../repositories/park.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { CreateFacilityZoneDTO, UpdateFacilityZoneDTO } from '../dtos/facility-zone.dto.js';

export const facilityZoneService = {
  async getFacilityZones(params) {
    return facilityZoneRepository.findAll(params);
  },

  async getFacilityZoneById(id) {
    const zone = await facilityZoneRepository.findById(id);
    if (!zone) {
      throw new AppError(`Facility Zone with ID ${id} not found`, 404);
    }
    return zone;
  },

  async createFacilityZone(data, userId) {
    const dto = new CreateFacilityZoneDTO(data);

    // 1. Validate Business Park exists and is active
    const park = await parkRepository.findById(dto.BusinessParkID);
    if (!park) {
      throw new AppError(`Business Park with ID ${dto.BusinessParkID} not found`, 404);
    }
    if (!park.IsActive) {
      throw new AppError(`Cannot create Facility Zone under inactive Business Park '${park.BusinessParkName}'`, 400);
    }

    // 2. Validate Zone Code uniqueness within Business Park
    const existing = await facilityZoneRepository.findByParkAndCode(dto.BusinessParkID, dto.FacilityZoneCode);
    if (existing) {
      throw new AppError(`Facility zone code '${dto.FacilityZoneCode}' already exists in this Business Park`, 409);
    }

    const newId = await facilityZoneRepository.create({ ...dto, CreatedBy: userId });
    return facilityZoneRepository.findById(newId);
  },

  async updateFacilityZone(id, data, userId) {
    const zone = await facilityZoneRepository.findById(id);
    if (!zone) {
      throw new AppError(`Facility Zone with ID ${id} not found`, 404);
    }

    const dto = new UpdateFacilityZoneDTO(data);
    return facilityZoneRepository.update(id, { ...dto, ModifiedBy: userId });
  },

  async deleteFacilityZone(id, userId) {
    const zone = await facilityZoneRepository.findById(id);
    if (!zone) {
      throw new AppError(`Facility Zone with ID ${id} not found`, 404);
    }

    // Safe Delete: Check if active buildings depend on this facility zone
    const activeBuildingsCount = await buildingRepository.countByZone(id);
    if (activeBuildingsCount > 0) {
      throw new AppError(
        `Cannot delete Facility Zone '${zone.FacilityZoneName}' because ${activeBuildingsCount} active building(s) still depend on it. Reassign or delete buildings first.`,
        409
      );
    }

    await facilityZoneRepository.softDelete(id, userId);
    return { message: `Facility Zone '${zone.FacilityZoneName}' deleted successfully` };
  }
};

export default facilityZoneService;
