import floorRepository from '../repositories/floor.repository.js';
import buildingRepository from '../repositories/building.repository.js';
import facilityZoneRepository from '../repositories/facility-zone.repository.js';
import parkRepository from '../repositories/park.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { CreateFloorDTO, UpdateFloorDTO } from '../dtos/floor.dto.js';

export const floorService = {
  async getFloors(params) {
    return floorRepository.findAll(params);
  },

  async getFloorById(id) {
    const floor = await floorRepository.findById(id);
    if (!floor) {
      throw new AppError(`Floor with ID ${id} not found`, 404);
    }
    return floor;
  },

  async createFloor(data, userId) {
    const dto = new CreateFloorDTO(data);

    // 1. Validate Building exists and is active
    const building = await buildingRepository.findById(dto.BuildingID);
    if (!building) {
      throw new AppError(`Building with ID ${dto.BuildingID} not found`, 404);
    }
    if (!building.IsActive) {
      throw new AppError(`Cannot create Floor under inactive Building '${building.BuildingName}'`, 400);
    }

    // 2. Validate Parent Facility Zone & Business Park are active
    if (building.FacilityZoneID) {
      const zone = await facilityZoneRepository.findById(building.FacilityZoneID);
      if (zone && !zone.IsActive) {
        throw new AppError(`Cannot create Floor because parent Facility Zone '${zone.FacilityZoneName}' is inactive`, 400);
      }
    }
    if (building.BusinessParkID) {
      const park = await parkRepository.findById(building.BusinessParkID);
      if (park && !park.IsActive) {
        throw new AppError(`Cannot create Floor because parent Business Park '${park.BusinessParkName}' is inactive`, 400);
      }
    }

    // 3. CRITICAL FLOOR RANGE RULE:
    // Floor number must be an integer >= 1 and <= building.TotalFloors
    const floorNum = Number(dto.FloorNumber);
    if (!Number.isInteger(floorNum) || floorNum < 1) {
      throw new AppError(`Floor level number must be a valid positive integer (minimum Level 1). Received: ${dto.FloorNumber}`, 400);
    }

    const maxFloors = building.TotalFloors || 1;
    if (floorNum > maxFloors) {
      throw new AppError(
        `Floor number ${floorNum} cannot exceed the configured ${maxFloors} floors for Building '${building.BuildingName}'. Allowed range: 1 to ${maxFloors}.`,
        400
      );
    }

    // 4. Duplicate Floor Number prevention
    const existingNum = await floorRepository.findByBuildingAndNumber(dto.BuildingID, floorNum);
    if (existingNum) {
      throw new AppError(`Floor number ${floorNum} already exists in Building '${building.BuildingName}'`, 409);
    }

    // 5. Duplicate Floor Code prevention
    const existingCode = await floorRepository.findByBuildingAndCode(dto.BuildingID, dto.FloorCode);
    if (existingCode) {
      throw new AppError(`Floor code '${dto.FloorCode}' already exists in Building '${building.BuildingName}'`, 409);
    }

    const newId = await floorRepository.create({ ...dto, FloorNumber: floorNum, CreatedBy: userId });
    return floorRepository.findById(newId);
  },

  async updateFloor(id, data, userId) {
    const floor = await floorRepository.findById(id);
    if (!floor) {
      throw new AppError(`Floor with ID ${id} not found`, 404);
    }

    const dto = new UpdateFloorDTO(data);

    // If FloorNumber is updated, re-validate range and uniqueness
    if (dto.FloorNumber !== undefined && dto.FloorNumber !== null) {
      const floorNum = Number(dto.FloorNumber);
      if (!Number.isInteger(floorNum) || floorNum < 1) {
        throw new AppError(`Floor level number must be a valid positive integer (minimum Level 1).`, 400);
      }

      const building = await buildingRepository.findById(floor.BuildingID);
      const maxFloors = building?.TotalFloors || 1;
      if (floorNum > maxFloors) {
        throw new AppError(
          `Floor number ${floorNum} cannot exceed the configured ${maxFloors} floors for Building '${building?.BuildingName}'.`,
          400
        );
      }

      if (floorNum !== floor.FloorNumber) {
        const existingNum = await floorRepository.findByBuildingAndNumber(floor.BuildingID, floorNum);
        if (existingNum && existingNum.FloorID !== Number(id)) {
          throw new AppError(`Floor number ${floorNum} already exists in Building '${building?.BuildingName}'`, 409);
        }
      }
    }

    // If FloorCode is updated, check uniqueness
    if (dto.FloorCode && dto.FloorCode !== floor.FloorCode) {
      const existingCode = await floorRepository.findByBuildingAndCode(floor.BuildingID, dto.FloorCode);
      if (existingCode && existingCode.FloorID !== Number(id)) {
        throw new AppError(`Floor code '${dto.FloorCode}' already exists in this Building`, 409);
      }
    }

    return floorRepository.update(id, { ...dto, ModifiedBy: userId });
  },

  async deleteFloor(id, userId) {
    const floor = await floorRepository.findById(id);
    if (!floor) {
      throw new AppError(`Floor with ID ${id} not found`, 404);
    }

    // Safe Delete: Check if active office units exist on this floor
    const activeOfficesCount = await floorRepository.countActiveOffices(id);
    if (activeOfficesCount > 0) {
      throw new AppError(
        `Cannot delete Floor '${floor.FloorName}' because ${activeOfficesCount} active office unit(s) still depend on it. Delete or reassign offices first.`,
        409
      );
    }

    await floorRepository.softDelete(id, userId);
    return { message: `Floor '${floor.FloorName}' deleted successfully` };
  }
};

export default floorService;
