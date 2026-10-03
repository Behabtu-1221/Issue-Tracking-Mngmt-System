import approvalGroupRepository from '../repositories/approval-group.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const approvalGroupService = {
  async getGroups(params) {
    return approvalGroupRepository.findAllGroups(params);
  },

  async getGroupById(id) {
    const group = await approvalGroupRepository.findGroupById(id);
    if (!group) {
      throw new AppError(`Approval group with ID ${id} not found`, 404);
    }
    return group;
  },

  async createGroup(data, userId) {
    return approvalGroupRepository.createGroup({
      ...data,
      CreatedBy: userId
    });
  },

  async updateGroup(id, data, userId) {
    await this.getGroupById(id);
    return approvalGroupRepository.updateGroup(id, {
      ...data,
      ModifiedBy: userId
    });
  },

  async addMember(groupId, userId, currentUserId) {
    await this.getGroupById(groupId);
    return approvalGroupRepository.addMember(groupId, userId, currentUserId);
  },

  async removeMember(groupId, userId, currentUserId) {
    await this.getGroupById(groupId);
    return approvalGroupRepository.removeMember(groupId, userId, currentUserId);
  }
};

export default approvalGroupService;
