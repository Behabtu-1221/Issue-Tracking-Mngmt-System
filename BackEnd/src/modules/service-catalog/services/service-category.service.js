import serviceCategoryRepository from '../repositories/service-category.repository.js';
import serviceCategoryMappingRepository from '../repositories/service-category-mapping.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const serviceCategoryService = {
  async getCategories(params) {
    return serviceCategoryRepository.findAll(params);
  },

  async getCategoryById(id) {
    const category = await serviceCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(`Service category with ID ${id} not found`, 404);
    }
    return category;
  },

  async createCategory(data, userId) {
    // Uniqueness: CategoryCode per Tenant
    const existing = await serviceCategoryRepository.findByTenantAndCode(data.TenantID, data.CategoryCode);
    if (existing) {
      throw new AppError(`Service category code '${data.CategoryCode}' already exists`, 409);
    }

    const { DepartmentID, ...categoryData } = data;
    const newId = await serviceCategoryRepository.create({ ...categoryData, CreatedBy: userId });

    if (DepartmentID) {
      await serviceCategoryMappingRepository.create({
        ServiceCategoryID: newId,
        DepartmentID: Number(DepartmentID),
        IsActive: 1,
        CreatedBy: userId
      });
    }

    return serviceCategoryRepository.findById(newId);
  },

  async updateCategory(id, data, userId) {
    const category = await serviceCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(`Service category with ID ${id} not found`, 404);
    }

    const { DepartmentID, ...categoryData } = data;
    await serviceCategoryRepository.update(id, { ...categoryData, ModifiedBy: userId });

    if (DepartmentID !== undefined) {
      const existingMapping = await serviceCategoryMappingRepository.findExistingMapping(id);
      if (existingMapping) {
        if (DepartmentID) {
          await serviceCategoryMappingRepository.update(existingMapping.MappingID, {
            DepartmentID: Number(DepartmentID),
            ModifiedBy: userId
          });
        } else {
          await serviceCategoryMappingRepository.softDelete(existingMapping.MappingID, userId);
        }
      } else if (DepartmentID) {
        await serviceCategoryMappingRepository.create({
          ServiceCategoryID: id,
          DepartmentID: Number(DepartmentID),
          IsActive: 1,
          CreatedBy: userId
        });
      }
    }

    return serviceCategoryRepository.findById(id);
  },

  async deleteCategory(id, userId) {
    const category = await serviceCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(`Service category with ID ${id} not found`, 404);
    }

    // Prevent deletion if category has active services
    if (category.ServiceCount > 0) {
      throw new AppError(
        `Cannot delete service category '${category.CategoryName}' because it contains ${category.ServiceCount} active services. Remove or reassign them first.`,
        400
      );
    }

    await serviceCategoryRepository.softDelete(id, userId);
    return { message: `Service category '${category.CategoryName}' deleted successfully` };
  }
};

export default serviceCategoryService;
