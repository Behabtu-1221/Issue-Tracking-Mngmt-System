import approvalDelegationRepository from '../repositories/approval-delegation.repository.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  return ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'DEPARTMENT_MANAGER'].includes(code);
};

export const approvalDelegationService = {
  async getDelegations(params, actor = null) {
    const queryParams = { ...params };
    if (actor && !isParkAdminActor(actor)) {
      // Non-admins can only query their own delegations
      queryParams.delegatorUserId = actor.userId;
    }
    return approvalDelegationRepository.findAll(queryParams);
  },

  async getDelegationById(id, actor = null) {
    const delegation = await approvalDelegationRepository.findById(id);
    if (!delegation) {
      throw new AppError(`Approval delegation with ID ${id} not found`, 404);
    }
    if (actor && !isParkAdminActor(actor)) {
      if (Number(delegation.DelegatorUserID) !== Number(actor.userId) && Number(delegation.DelegateeUserID) !== Number(actor.userId)) {
        throw new AppError(`Approval delegation with ID ${id} not found`, 404);
      }
    }
    return delegation;
  },

  async createDelegation(data, actor) {
    const actorId = actor?.userId || data.DelegatorUserID;
    if (actor && !isParkAdminActor(actor) && Number(data.DelegatorUserID) !== Number(actorId)) {
      throw new AppError('You can only create approval delegations for yourself', 403);
    }

    if (Number(data.DelegatorUserID) === Number(data.DelegateeUserID)) {
      throw new AppError('Delegator and Delegatee cannot be the same user', 400);
    }

    if (new Date(data.EndDateTime) <= new Date(data.StartDateTime)) {
      throw new AppError('End date/time must be after start date/time', 400);
    }

    return approvalDelegationRepository.create({
      ...data,
      CreatedBy: actorId
    });
  },

  async updateDelegation(id, data, actor) {
    await this.getDelegationById(id, actor);
    return approvalDelegationRepository.update(id, {
      ...data,
      ModifiedBy: actor?.userId
    });
  },

  async deleteDelegation(id, actor) {
    await this.getDelegationById(id, actor);
    await approvalDelegationRepository.softDelete(id, actor?.userId);
    return { message: 'Approval delegation deleted successfully.' };
  }
};

export default approvalDelegationService;
