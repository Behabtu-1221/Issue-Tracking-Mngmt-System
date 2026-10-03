import buildingRepository from '../repositories/building.repository.js';
import facilityZoneRepository from '../repositories/facility-zone.repository.js';
import parkRepository from '../repositories/park.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { CreateBuildingDTO, UpdateBuildingDTO } from '../dtos/building.dto.js';

export const buildingService = {
  async getBuildings(params) {
    return buildingRepository.findAll(params);
  },

  async getBuildingById(id) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError(`Building with ID ${id} not found`, 404);
    }
    return building;
  },

  async createBuilding(data, userId) {
    const dto = new CreateBuildingDTO(data);

    // 1. Validate Business Park exists and is active
    const park = await parkRepository.findById(dto.BusinessParkID);
    if (!park) {
      throw new AppError(`Business Park with ID ${dto.BusinessParkID} not found`, 404);
    }
    if (!park.IsActive) {
      throw new AppError(`Cannot create Building under inactive Business Park '${park.BusinessParkName}'`, 400);
    }

    // 2. Validate Facility Zone exists and is active
    const zone = await facilityZoneRepository.findById(dto.FacilityZoneID);
    if (!zone) {
      throw new AppError(`Facility Zone with ID ${dto.FacilityZoneID} not found`, 404);
    }
    if (!zone.IsActive) {
      throw new AppError(`Cannot create Building under inactive Facility Zone '${zone.FacilityZoneName}'`, 400);
    }

    // 3. CRITICAL HIERARCHY CHECK: Verify Zone belongs to the specified Business Park
    if (Number(zone.BusinessParkID) !== Number(dto.BusinessParkID)) {
      throw new AppError(
        `Facility Zone '${zone.FacilityZoneName}' (ID: ${dto.FacilityZoneID}) belongs to Business Park ID ${zone.BusinessParkID}, not the specified Business Park (ID: ${dto.BusinessParkID}).`,
        400
      );
    }

    // 4. Validate Building Code uniqueness within the Business Park
    const existing = await buildingRepository.findByParkAndCode(dto.BusinessParkID, dto.BuildingCode);
    if (existing) {
      throw new AppError(`Building code '${dto.BuildingCode}' already exists in this Business Park`, 409);
    }

    // 5. Validate Number of Floors
    if (!dto.TotalFloors || dto.TotalFloors < 1) {
      throw new AppError('Total floors must be a valid positive integer (minimum 1).', 400);
    }

    const newId = await buildingRepository.create({ ...dto, CreatedBy: userId });
    return buildingRepository.findById(newId);
  },

  async updateBuilding(id, data, userId) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError(`Building with ID ${id} not found`, 404);
    }

    const dto = new UpdateBuildingDTO(data);

    // If FacilityZoneID is being changed, validate it
    if (dto.FacilityZoneID && Number(dto.FacilityZoneID) !== Number(building.FacilityZoneID)) {
      const zone = await facilityZoneRepository.findById(dto.FacilityZoneID);
      if (!zone) {
        throw new AppError(`Facility Zone with ID ${dto.FacilityZoneID} not found`, 404);
      }
      if (!zone.IsActive) {
        throw new AppError(`Cannot assign Building to inactive Facility Zone '${zone.FacilityZoneName}'`, 400);
      }
      if (Number(zone.BusinessParkID) !== Number(building.BusinessParkID)) {
        throw new AppError(
          `Facility Zone '${zone.FacilityZoneName}' belongs to Business Park ID ${zone.BusinessParkID}, which does not match Building's Business Park (ID: ${building.BusinessParkID}).`,
          400
        );
      }
    }

    return buildingRepository.update(id, { ...dto, ModifiedBy: userId });
  },

  async deleteBuilding(id, userId) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError(`Building with ID ${id} not found`, 404);
    }

    // Safe Delete: Check if active floors depend on this building
    const activeFloorsCount = await buildingRepository.countActiveFloors(id);
    if (activeFloorsCount > 0) {
      throw new AppError(
        `Cannot delete Building '${building.BuildingName}' because ${activeFloorsCount} active floor(s) still depend on it. Delete or reassign floors first.`,
        409
      );
    }

    await buildingRepository.softDelete(id, userId);
    return { message: `Building '${building.BuildingName}' deleted successfully` };
  }
};

export default buildingService;
