import floorPlanRepository from '../repositories/floor-plan.repository.js';
import floorRepository from '../repositories/floor.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const floorPlanService = {
  async getFloorPlanByFloorId(floorId) {
    const floor = await floorRepository.findById(floorId);
    if (!floor) {
      throw new AppError(`Floor with ID ${floorId} not found`, 404);
    }

    const plan = await floorPlanRepository.findByFloorId(floorId);
    if (!plan) {
      throw new AppError(`No floor plan blueprint registered for floor '${floor.FloorName}'`, 404);
    }
    return plan;
  },

  async createFloorPlan(data, userId) {
    const floor = await floorRepository.findById(data.FloorID);
    if (!floor) {
      throw new AppError(`Floor with ID ${data.FloorID} not found`, 404);
    }

    const existing = await floorPlanRepository.findByFloorId(data.FloorID);
    if (existing) {
      throw new AppError(`Floor '${floor.FloorName}' already has an active floor plan registered`, 409);
    }

    const newId = await floorPlanRepository.create({ ...data, CreatedBy: userId });
    return floorPlanRepository.findById(newId);
  },

  async updateFloorPlan(id, data, userId) {
    const plan = await floorPlanRepository.findById(id);
    if (!plan) {
      throw new AppError(`Floor plan with ID ${id} not found`, 404);
    }

    return floorPlanRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteFloorPlan(id, userId) {
    const plan = await floorPlanRepository.findById(id);
    if (!plan) {
      throw new AppError(`Floor plan with ID ${id} not found`, 404);
    }

    await floorPlanRepository.softDelete(id, userId);
    return { message: `Floor plan '${plan.FloorPlanName}' deleted successfully` };
  }
};

export default floorPlanService;
