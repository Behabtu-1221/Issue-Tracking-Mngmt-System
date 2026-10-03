import { query } from '../../../database/connection.js';

export const slaPolicyRepository = {
  async findAllPolicies({ search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM SLAStage st WHERE st.SLAPolicyID = p.SLAPolicyID AND st.IsDeleted = 0) AS StageCount
      FROM SLAPolicy p
      WHERE p.IsDeleted = 0
    `;

    const params = [];
    if (search) {
      sql += ` AND (p.PolicyName LIKE ? OR p.Description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.PolicyName ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const policies = await query(sql, params);
    return { policies, total: policies.length };
  },

  async findPolicyById(policyId) {
    const sql = `SELECT * FROM SLAPolicy WHERE SLAPolicyID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [policyId]);
    if (rows.length === 0) return null;

    const stagesSql = `SELECT * FROM SLAStage WHERE SLAPolicyID = ? AND IsDeleted = 0 ORDER BY CASE PriorityCode WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END`;
    const stages = await query(stagesSql, [policyId]);

    return { ...rows[0], stages };
  },

  async createPolicy(data) {
    const sql = `
      INSERT INTO SLAPolicy (PolicyName, Description, BusinessCalendarID, CreatedBy)
      VALUES (?, ?, ?, ?)
    `;
    const params = [
      data.PolicyName,
      data.Description || null,
      data.BusinessCalendarID || 1,
      data.CreatedBy || 1
    ];
    const res = await query(sql, params);
    return res.insertId;
  },

  async createStage(data) {
    const sql = `
      INSERT INTO SLAStage (SLAPolicyID, PriorityCode, TargetResponseMinutes, TargetResolutionMinutes, CreatedBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.SLAPolicyID,
      data.PriorityCode,
      data.TargetResponseMinutes,
      data.TargetResolutionMinutes,
      data.CreatedBy || 1
    ];
    const res = await query(sql, params);
    return res.insertId;
  },

  async findStageByPriority(policyId, priorityCode) {
    const sql = `
      SELECT * FROM SLAStage
      WHERE SLAPolicyID = ? AND PriorityCode = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [policyId, priorityCode]);
    return rows[0] || null;
  }
};

export default slaPolicyRepository;
