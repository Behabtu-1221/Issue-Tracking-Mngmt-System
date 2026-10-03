import departmentRepository from '../repositories/department.repository.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  return ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(code);
};

export const departmentService = {
  async getDepartments(params, actor, dataScope) {
    const filters = { ...params };
    if (!isParkAdminActor(actor) && actor?.tenantId) {
      filters.tenantId = actor.tenantId;
    }
    return departmentRepository.findAll(filters);
  },

  async getDepartmentById(id, actor, dataScope) {
    const dept = await departmentRepository.findById(id);
    if (!dept) {
      throw new AppError(`Department with ID ${id} not found`, 404);
    }
    if (!isParkAdminActor(actor) && dept.TenantID && dept.TenantID !== actor?.tenantId) {
      throw new AppError(`Department with ID ${id} not found`, 404);
    }
    return dept;
  },

  async createDepartment(data, actor, dataScope) {
    const actorId = actor?.userId || 1;

    // Uniqueness: DepartmentCode check
    const existing = await departmentRepository.findByCode(data.DepartmentCode);
    if (existing) {
      throw new AppError(
        `Department code '${data.DepartmentCode}' already exists`,
        409
      );
    }

    const newId = await departmentRepository.create({ ...data, CreatedBy: actorId });
    return departmentRepository.findById(newId);
  },

  async updateDepartment(id, data, actor, dataScope) {
    const actorId = actor?.userId || 1;
    const dept = await this.getDepartmentById(id, actor, dataScope);

    return departmentRepository.update(id, { ...data, ModifiedBy: actorId });
  },

  async deleteDepartment(id, actor, dataScope) {
    const actorId = actor?.userId || 1;
    const dept = await this.getDepartmentById(id, actor, dataScope);

    if (dept.ActiveEmployeeCount > 0) {
      throw new AppError(
        `Cannot delete department '${dept.DepartmentName}' because it has ${dept.ActiveEmployeeCount} assigned active employee(s). Reassign them first.`,
        400
      );
    }

    await departmentRepository.softDelete(id, actorId);
    return { message: `Department '${dept.DepartmentName}' deleted successfully` };
  },

  // Department Locations
  async getDepartmentLocations(deptId, actor) {
    await this.getDepartmentById(deptId, actor);
    return departmentRepository.getLocations(deptId);
  },

  async addDepartmentLocation(deptId, officeSpaceId, actor) {
    const actorId = actor?.userId || 1;
    await this.getDepartmentById(deptId, actor);
    return departmentRepository.addLocation(deptId, officeSpaceId, actorId);
  },

  async removeDepartmentLocation(locId, actor) {
    const actorId = actor?.userId || 1;
    return departmentRepository.removeLocation(locId, actorId);
  }
};

export default departmentService;
