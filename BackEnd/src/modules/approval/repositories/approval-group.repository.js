import { query } from '../../../database/connection.js';

export const approvalGroupRepository = {
  async findAllGroups({ tenantId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ag.*,
        t.CompanyName AS TenantName,
        (SELECT COUNT(*) FROM ApprovalMember am WHERE am.ApprovalGroupID = ag.ApprovalGroupID AND am.IsDeleted = 0) AS MemberCount
      FROM ApprovalGroup ag
      LEFT JOIN Tenant t ON ag.TenantID = t.TenantID
      WHERE ag.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND ag.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (search) {
      sql += ` AND (ag.GroupName LIKE ? OR ag.Description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY ag.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM ApprovalGroup ag WHERE ag.IsDeleted = 0`;
    const countParams = [];
    if (tenantId) { countSql += ` AND ag.TenantID = ?`; countParams.push(Number(tenantId)); }
    const countRes = await query(countSql, countParams);

    return {
      groups: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findGroupById(id) {
    const sql = `
      SELECT ag.*, t.CompanyName AS TenantName
      FROM ApprovalGroup ag
      LEFT JOIN Tenant t ON ag.TenantID = t.TenantID
      WHERE ag.ApprovalGroupID = ? AND ag.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    if (!rows[0]) return null;

    const group = rows[0];
    const membersSql = `
      SELECT am.*, CONCAT(u.FirstName, ' ', u.LastName) AS MemberName, u.Email AS MemberEmail
      FROM ApprovalMember am
      JOIN \`User\` u ON am.UserID = u.UserID
      WHERE am.ApprovalGroupID = ? AND am.IsDeleted = 0 AND am.IsActive = 1
    `;
    group.members = await query(membersSql, [id]);
    return group;
  },

  async findGroupsForUser(userId) {
    const sql = `
      SELECT ag.*
      FROM ApprovalGroup ag
      JOIN ApprovalMember am ON ag.ApprovalGroupID = am.ApprovalGroupID
      WHERE am.UserID = ? AND am.IsActive = 1 AND am.IsDeleted = 0 AND ag.IsDeleted = 0
    `;
    return query(sql, [userId]);
  },

  async createGroup(data) {
    const sql = `
      INSERT INTO ApprovalGroup (
        TenantID, GroupName, Description, CreatedBy
      ) VALUES (?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID || null,
      data.GroupName,
      data.Description || null,
      data.CreatedBy || 1
    ]);
    return this.findGroupById(result.insertId);
  },

  async updateGroup(id, data) {
    const sql = `
      UPDATE ApprovalGroup SET
        GroupName = COALESCE(?, GroupName),
        Description = COALESCE(?, Description),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalGroupID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.GroupName ?? null,
      data.Description ?? null,
      data.IsActive ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findGroupById(id);
  },

  async addMember(groupId, userId, createdBy) {
    const sql = `
      INSERT INTO ApprovalMember (ApprovalGroupID, UserID, CreatedBy)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE IsActive = 1, IsDeleted = 0
    `;
    await query(sql, [groupId, userId, createdBy || 1]);
    return this.findGroupById(groupId);
  },

  async removeMember(groupId, userId, deletedBy) {
    const sql = `
      UPDATE ApprovalMember SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalGroupID = ? AND UserID = ? AND IsDeleted = 0
    `;
    await query(sql, [deletedBy || 1, groupId, userId]);
    return true;
  }
};

export default approvalGroupRepository;
