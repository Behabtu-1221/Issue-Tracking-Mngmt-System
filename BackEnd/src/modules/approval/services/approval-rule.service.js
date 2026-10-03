import approvalRuleRepository from '../repositories/approval-rule.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const approvalRuleService = {
  async getRules(params) {
    return approvalRuleRepository.findAllRules(params);
  },

  async getRuleById(id) {
    const rule = await approvalRuleRepository.findRuleById(id);
    if (!rule) {
      throw new AppError(`Approval rule with ID ${id} not found`, 404);
    }
    return rule;
  },

  async createRule(data, userId) {
    return approvalRuleRepository.createRule({
      ...data,
      CreatedBy: userId
    });
  },

  async updateRule(id, data, userId) {
    await this.getRuleById(id);
    return approvalRuleRepository.updateRule(id, {
      ...data,
      ModifiedBy: userId
    });
  },

  async deleteRule(id, userId) {
    await this.getRuleById(id);
    await approvalRuleRepository.softDeleteRule(id, userId);
    return { message: 'Approval rule deleted successfully.' };
  },

  // Thresholds
  async getThresholds(params) {
    return approvalRuleRepository.findAllThresholds(params);
  },

  async createThreshold(data, userId) {
    return approvalRuleRepository.createThreshold({
      ...data,
      CreatedBy: userId
    });
  }
};

export default approvalRuleService;
