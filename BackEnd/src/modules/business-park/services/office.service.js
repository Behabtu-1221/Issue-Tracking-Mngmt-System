import officeRepository from '../repositories/office.repository.js';
import floorRepository from '../repositories/floor.repository.js';
import buildingRepository from '../repositories/building.repository.js';
import facilityZoneRepository from '../repositories/facility-zone.repository.js';
import parkRepository from '../repositories/park.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { CreateOfficeUnitDTO, UpdateOfficeUnitDTO } from '../dtos/office.dto.js';

export const officeService = {
  async getOffices(params) {
    return officeRepository.findAll(params);
  },

  async getOfficeById(id) {
    const office = await officeRepository.findById(id);
    if (!office) {
      throw new AppError(`Office space with ID ${id} not found`, 404);
    }
    return office;
  },

  async createOffice(data, userId) {
    const dto = new CreateOfficeUnitDTO(data);

    // 1. Validate Floor exists and is active
    const floor = await floorRepository.findById(dto.FloorID);
    if (!floor) {
      throw new AppError(`Floor with ID ${dto.FloorID} not found`, 404);
    }
    if (!floor.IsActive) {
      throw new AppError(`Cannot create Office Unit under inactive Floor '${floor.FloorName}'`, 400);
    }

    // 2. Validate entire parent hierarchy: Building -> Facility Zone -> Business Park
    const building = await buildingRepository.findById(floor.BuildingID);
    if (!building) {
      throw new AppError(`Parent Building with ID ${floor.BuildingID} not found`, 404);
    }
    if (!building.IsActive) {
      throw new AppError(`Cannot create Office Unit because parent Building '${building.BuildingName}' is inactive`, 400);
    }

    if (building.FacilityZoneID) {
      const zone = await facilityZoneRepository.findById(building.FacilityZoneID);
      if (zone && !zone.IsActive) {
        throw new AppError(`Cannot create Office Unit because parent Facility Zone '${zone.FacilityZoneName}' is inactive`, 400);
      }
    }

    if (building.BusinessParkID) {
      const park = await parkRepository.findById(building.BusinessParkID);
      if (park && !park.IsActive) {
        throw new AppError(`Cannot create Office Unit because parent Business Park '${park.BusinessParkName}' is inactive`, 400);
      }
    }

    // 3. Duplicate Office Number on same floor prevention
    const existing = await officeRepository.findByFloorAndNumber(dto.FloorID, dto.OfficeNumber);
    if (existing) {
      throw new AppError(`Office number '${dto.OfficeNumber}' already exists on floor '${floor.FloorName}'`, 409);
    }

    // 4. CRITICAL OFFICE CAPACITY RULE:
    // Check configured capacity limit on Floor
    const activeOfficeCount = await officeRepository.countActiveByFloor(dto.FloorID);
    if (floor.TotalOfficeSpaces > 0 && activeOfficeCount >= floor.TotalOfficeSpaces) {
      throw new AppError(
        `This floor has reached its maximum office-unit capacity (${activeOfficeCount} / ${floor.TotalOfficeSpaces}). Cannot create more office units on Floor '${floor.FloorName}'.`,
        409
      );
    }

    const newId = await officeRepository.create({ ...dto, CreatedBy: userId });
    return officeRepository.findById(newId);
  },

  async updateOffice(id, data, userId) {
    const office = await officeRepository.findById(id);
    if (!office) {
      throw new AppError(`Office space with ID ${id} not found`, 404);
    }

    const dto = new UpdateOfficeUnitDTO(data);

    // If OfficeNumber is changed, verify uniqueness
    if (dto.OfficeNumber && dto.OfficeNumber !== office.OfficeNumber) {
      const existing = await officeRepository.findByFloorAndNumber(office.FloorID, dto.OfficeNumber);
      if (existing && existing.OfficeSpaceID !== Number(id)) {
        throw new AppError(`Office number '${dto.OfficeNumber}' already exists on this floor`, 409);
      }
    }

    return officeRepository.update(id, { ...dto, ModifiedBy: userId });
  },

  async updateStatus(id, status, userId) {
    const office = await officeRepository.findById(id);
    if (!office) {
      throw new AppError(`Office space with ID ${id} not found`, 404);
    }

    const validStatuses = ['VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid availability status '${status}'. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    return officeRepository.updateStatus(id, status, userId);
  },

  async deleteOffice(id, userId) {
    const office = await officeRepository.findById(id);
    if (!office) {
      throw new AppError(`Office space with ID ${id} not found`, 404);
    }

    await officeRepository.softDelete(id, userId);
    return { message: `Office space '${office.OfficeNumber}' deleted successfully` };
  }
};

export default officeService;
