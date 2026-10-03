import teamRepository from '../repositories/team.repository.js';
import departmentRepository from '../repositories/department.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const teamService = {
  async getTeams(params, dataScope) {
    const filters = { ...params };
    if (dataScope && dataScope.tenantId) {
      filters.tenantId = dataScope.tenantId;
    }
    if (dataScope && dataScope.type === 'DEPARTMENT' && dataScope.departmentId) {
      filters.departmentId = dataScope.departmentId;
    }
    return teamRepository.findAll(filters);
  },

  async getTeamById(id, dataScope) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError(`Team with ID ${id} not found`, 404);
    }
    if (dataScope && dataScope.tenantId && team.TenantID && team.TenantID !== dataScope.tenantId) {
      throw new AppError(`Team with ID ${id} not found`, 404);
    }
    if (dataScope && dataScope.type === 'DEPARTMENT' && dataScope.departmentId && team.DepartmentID !== dataScope.departmentId) {
      throw new AppError(`Access denied: Team belongs to another department`, 403);
    }
    return team;
  },

  async createTeam(data, userId, dataScope) {
    let departmentId = data.DepartmentID;

    // Enforce dataScope departmentId if actor is a Manager
    if (dataScope && dataScope.type === 'DEPARTMENT' && dataScope.departmentId) {
      departmentId = dataScope.departmentId;
    }

    const dept = await departmentRepository.findById(departmentId);
    if (!dept) {
      throw new AppError(`Department with ID ${departmentId} not found`, 404);
    }

    // Uniqueness: TeamCode under Department
    const code = data.TeamCode || `TEAM-${Date.now().toString().slice(-4)}`;
    const existing = await teamRepository.findByDeptAndCode(departmentId, code);
    if (existing) {
      throw new AppError(
        `Team code '${code}' already exists in department '${dept.DepartmentName}'`,
        409
      );
    }

    const newId = await teamRepository.create({
      ...data,
      DepartmentID: departmentId,
      TeamCode: code,
      CreatedBy: userId
    });
    return teamRepository.findById(newId);
  },

  async updateTeam(id, data, userId, dataScope) {
    await this.getTeamById(id, dataScope); // Access check
    return teamRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteTeam(id, userId, dataScope) {
    const team = await this.getTeamById(id, dataScope); // Access check

    if (team.MemberCount > 0) {
      throw new AppError(
        `Cannot delete team '${team.TeamName}' because it has ${team.MemberCount} active member(s). Reassign them first.`,
        400
      );
    }

    await teamRepository.softDelete(id, userId);
    return { message: `Team '${team.TeamName}' deleted successfully` };
  },

  async getTeamMembers(teamId, dataScope) {
    await this.getTeamById(teamId, dataScope); // Access check
    return teamRepository.findTeamMembers(teamId);
  },

  async addTeamMember(teamId, { userId, roleInTeam }, actorUserId, dataScope) {
    await this.getTeamById(teamId, dataScope); // Access check
    return teamRepository.addMember({ teamId, userId, roleInTeam, createdBy: actorUserId });
  },

  async removeTeamMember(teamId, memberUserId, actorUserId, dataScope) {
    await this.getTeamById(teamId, dataScope); // Access check
    return teamRepository.removeMember(teamId, memberUserId, actorUserId);
  },

  async getEligibleTechnicians(dataScope) {
    const tenantId = dataScope?.tenantId || null;
    const departmentId = dataScope?.type === 'DEPARTMENT' ? dataScope.departmentId : null;
    return teamRepository.findEligibleTechnicians({ tenantId, departmentId });
  },

  async getTeamWorkloadSummary(dataScope) {
    const tenantId = dataScope?.tenantId || null;
    const departmentId = dataScope?.type === 'DEPARTMENT' ? dataScope.departmentId : null;
    return teamRepository.getTeamWorkloadSummary({ tenantId, departmentId });
  }
};

export default teamService;
