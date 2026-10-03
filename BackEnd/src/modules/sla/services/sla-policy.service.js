import slaPolicyRepository from '../repositories/sla-policy.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const slaPolicyService = {
  async getPolicies(params) {
    return slaPolicyRepository.findAllPolicies(params);
  },

  async getPolicyById(id) {
    const policy = await slaPolicyRepository.findPolicyById(id);
    if (!policy) {
      throw new AppError('SLA Policy not found', 404);
    }
    return policy;
  },

  async createPolicy(data, actionUserId = 1) {
    if (!data.PolicyName) {
      throw new AppError('PolicyName is required', 400);
    }

    const policyId = await slaPolicyRepository.createPolicy({
      PolicyName: data.PolicyName,
      Description: data.Description,
      BusinessCalendarID: data.BusinessCalendarID || 1,
      CreatedBy: actionUserId
    });

    // Create default priority stages if provided or defaults
    const stages = data.stages || [
      { PriorityCode: 'CRITICAL', TargetResponseMinutes: 15, TargetResolutionMinutes: 240 },
      { PriorityCode: 'HIGH', TargetResponseMinutes: 60, TargetResolutionMinutes: 480 },
      { PriorityCode: 'MEDIUM', TargetResponseMinutes: 120, TargetResolutionMinutes: 1440 },
      { PriorityCode: 'LOW', TargetResponseMinutes: 240, TargetResolutionMinutes: 2880 }
    ];

    for (const st of stages) {
      await slaPolicyRepository.createStage({
        SLAPolicyID: policyId,
        PriorityCode: st.PriorityCode,
        TargetResponseMinutes: st.TargetResponseMinutes,
        TargetResolutionMinutes: st.TargetResolutionMinutes,
        CreatedBy: actionUserId
      });
    }

    return slaPolicyRepository.findPolicyById(policyId);
  }
};

export default slaPolicyService;
