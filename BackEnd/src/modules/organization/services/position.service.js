import positionRepository from '../repositories/position.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const positionService = {
  async getPositions(params) {
    return positionRepository.findAll(params);
  },

  async getPositionById(id) {
    const pos = await positionRepository.findById(id);
    if (!pos) {
      throw new AppError(`Position with ID ${id} not found`, 404);
    }
    return pos;
  },

  async createPosition(data, userId) {
    // Uniqueness check: PositionCode
    const existing = await positionRepository.findByCode(data.PositionCode);
    if (existing) {
      throw new AppError(
        `Position code '${data.PositionCode}' already exists`,
        409
      );
    }

    const newId = await positionRepository.create({ ...data, CreatedBy: userId });
    return positionRepository.findById(newId);
  },

  async updatePosition(id, data, userId) {
    const pos = await positionRepository.findById(id);
    if (!pos) {
      throw new AppError(`Position with ID ${id} not found`, 404);
    }

    return positionRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deletePosition(id, userId) {
    const pos = await positionRepository.findById(id);
    if (!pos) {
      throw new AppError(`Position with ID ${id} not found`, 404);
    }

    if (pos.AssignedCount > 0) {
      throw new AppError(
        `Cannot delete position '${pos.PositionTitle}' because it has ${pos.AssignedCount} assigned employee(s). Reassign them first.`,
        400
      );
    }

    await positionRepository.softDelete(id, userId);
    return { message: `Position '${pos.PositionTitle}' deleted successfully` };
  }
};

export default positionService;
