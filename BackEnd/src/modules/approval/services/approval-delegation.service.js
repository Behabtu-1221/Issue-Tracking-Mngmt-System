import approvalDelegationRepository from '../repositories/approval-delegation.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const approvalDelegationService = {
  async getDelegations(params) {
    return approvalDelegationRepository.findAll(params);
  },

  async getDelegationById(id) {
    const delegation = await approvalDelegationRepository.findById(id);
    if (!delegation) {
      throw new AppError(`Approval delegation with ID ${id} not found`, 404);
    }
    return delegation;
  },

  async createDelegation(data, userId) {
    if (Number(data.DelegatorUserID) === Number(data.DelegateeUserID)) {
      throw new AppError('Delegator and Delegatee cannot be the same user', 400);
    }

    if (new Date(data.EndDateTime) <= new Date(data.StartDateTime)) {
      throw new AppError('End date/time must be after start date/time', 400);
    }

    return approvalDelegationRepository.create({
      ...data,
      CreatedBy: userId || data.DelegatorUserID
    });
  },

  async updateDelegation(id, data, userId) {
    await this.getDelegationById(id);
    return approvalDelegationRepository.update(id, {
      ...data,
      ModifiedBy: userId
    });
  },

  async deleteDelegation(id, userId) {
    await this.getDelegationById(id);
    await approvalDelegationRepository.softDelete(id, userId);
    return { message: 'Approval delegation deleted successfully.' };
  }
};

export default approvalDelegationService;
