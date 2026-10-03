import serviceCategoryMappingRepository from '../repositories/service-category-mapping.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { query } from '../../../database/connection.js';

export const serviceCategoryMappingService = {
  /**
   * Get all category mappings across the business park.
   */
  async getMappings(params = {}) {
    return serviceCategoryMappingRepository.findAll(params);
  },

  /**
   * Get single mapping by ID.
   */
  async getMappingById(id) {
    const mapping = await serviceCategoryMappingRepository.findById(id);
    if (!mapping) {
      throw new AppError(`Category mapping with ID ${id} not found`, 404);
    }
    return mapping;
  },

  /**
   * Create a new category-to-department mapping for the business park.
   */
  async createMapping(data, actor) {
    const actorId = actor?.userId || actor?.UserID || 1;

    // 1. Verify Service Category exists
    const [cat] = await query(
      `SELECT ServiceCategoryID, CategoryName FROM ServiceCategory WHERE ServiceCategoryID = ? AND IsDeleted = 0`,
      [data.ServiceCategoryID]
    );
    if (!cat) {
      throw new AppError(`Service Category with ID ${data.ServiceCategoryID} not found`, 404);
    }

    // 2. Verify Department exists (departments are accountable to the business park)
    const [dept] = await query(
      `SELECT d.DepartmentID, d.DepartmentName
       FROM Department d
       WHERE d.DepartmentID = ? AND d.IsDeleted = 0`,
      [data.DepartmentID]
    );
    if (!dept) {
      throw new AppError(`Department with ID ${data.DepartmentID} not found`, 404);
    }

    // 3. Check for existing active mapping for this category
    const existing = await serviceCategoryMappingRepository.findExistingMapping(data.ServiceCategoryID);
    if (existing) {
      throw new AppError(`A department mapping already exists for Service Category '${cat.CategoryName}'. Please edit the existing mapping instead of creating a duplicate.`, 409);
    }

    const newId = await serviceCategoryMappingRepository.create({
      ServiceCategoryID: Number(data.ServiceCategoryID),
      DepartmentID: Number(data.DepartmentID),
      IsActive: data.IsActive !== undefined ? Number(data.IsActive) : 1,
      CreatedBy: Number(actorId)
    });

    return serviceCategoryMappingRepository.findById(newId);
  },

  /**
   * Update an existing category mapping.
   */
  async updateMapping(id, data, actor) {
    const existing = await this.getMappingById(id);
    const actorId = actor?.userId || actor?.UserID || 1;

    if (data.DepartmentID && Number(data.DepartmentID) !== Number(existing.DepartmentID)) {
      const [dept] = await query(
        `SELECT d.DepartmentID, d.DepartmentName
         FROM Department d
         WHERE d.DepartmentID = ? AND d.IsDeleted = 0`,
        [data.DepartmentID]
      );
      if (!dept) {
        throw new AppError(`Department with ID ${data.DepartmentID} not found`, 404);
      }
    }

    if (data.ServiceCategoryID && Number(data.ServiceCategoryID) !== Number(existing.ServiceCategoryID)) {
      const existingDup = await serviceCategoryMappingRepository.findExistingMapping(
        data.ServiceCategoryID,
        id
      );
      if (existingDup) {
        throw new AppError(`A department mapping already exists for this Service Category.`, 409);
      }
    }

    const updated = await serviceCategoryMappingRepository.update(id, {
      ServiceCategoryID: data.ServiceCategoryID ? Number(data.ServiceCategoryID) : undefined,
      DepartmentID: data.DepartmentID ? Number(data.DepartmentID) : undefined,
      IsActive: data.IsActive !== undefined ? Number(data.IsActive) : undefined,
      ModifiedBy: Number(actorId)
    });

    return updated;
  },

  /**
   * Toggle active/inactive status of a mapping.
   */
  async updateStatus(id, isActive, actor) {
    return this.updateMapping(id, { IsActive: isActive ? 1 : 0 }, actor);
  },

  /**
   * Soft delete a category mapping.
   */
  async deleteMapping(id, actor) {
    await this.getMappingById(id);
    const actorId = actor?.userId || actor?.UserID || 1;
    await serviceCategoryMappingRepository.softDelete(id, Number(actorId));
    return { message: 'Service category department mapping removed successfully' };
  }
};

export default serviceCategoryMappingService;
