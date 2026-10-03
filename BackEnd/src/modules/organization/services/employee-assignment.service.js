import employeeAssignmentRepository from '../repositories/employee-assignment.repository.js';
import departmentRepository from '../repositories/department.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { query } from '../../../database/connection.js';

export const employeeAssignmentService = {
  async getAssignments(params) {
    return employeeAssignmentRepository.findAll(params);
  },

  async getAssignmentById(id) {
    const assignment = await employeeAssignmentRepository.findById(id);
    if (!assignment) {
      throw new AppError(`Employee assignment with ID ${id} not found`, 404);
    }
    return assignment;
  },

  async createAssignment(data, userId) {
    // Validate User exists
    const userRows = await query(`SELECT * FROM \`User\` WHERE UserID = ? AND IsDeleted = 0`, [data.UserID]);
    if (userRows.length === 0) {
      throw new AppError(`User with ID ${data.UserID} not found`, 404);
    }

    // Validate Department
    const dept = await departmentRepository.findById(data.DepartmentID);
    if (!dept) {
      throw new AppError(`Department with ID ${data.DepartmentID} not found`, 404);
    }

    // Auto-clear existing primary flag if new assignment is primary
    if (data.IsPrimary) {
      await employeeAssignmentRepository.clearPrimaryFlag(data.UserID);
    }

    const newId = await employeeAssignmentRepository.create({ ...data, CreatedBy: userId });
    return employeeAssignmentRepository.findById(newId);
  },

  async updateAssignment(id, data, userId) {
    const assignment = await employeeAssignmentRepository.findById(id);
    if (!assignment) {
      throw new AppError(`Employee assignment with ID ${id} not found`, 404);
    }

    // Auto-clear existing primary flag if set to primary
    if (data.IsPrimary) {
      await employeeAssignmentRepository.clearPrimaryFlag(assignment.UserID);
    }

    return employeeAssignmentRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteAssignment(id, userId) {
    const assignment = await employeeAssignmentRepository.findById(id);
    if (!assignment) {
      throw new AppError(`Employee assignment with ID ${id} not found`, 404);
    }

    await employeeAssignmentRepository.softDelete(id, userId);
    return { message: `Employee assignment deleted successfully` };
  }
};

export default employeeAssignmentService;
