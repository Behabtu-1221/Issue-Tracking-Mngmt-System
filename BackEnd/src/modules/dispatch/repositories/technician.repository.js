import { query } from '../../../database/connection.js';

export const technicianRepository = {
  async getTechnicians({ tenantId, departmentId, search, availabilityStatus, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT u.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS FullName,
        u.Email,
        u.PhoneNumber,
        ea.DepartmentID,
        COALESCE(ta.AvailabilityStatusCode, 'AVAILABLE') AS AvailabilityStatusCode,
        ta.LastStatusChangeDateTime,
        (SELECT COUNT(*) FROM Assignment a WHERE a.AssignedUserID = u.UserID AND a.AssignmentStatusCode IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PAUSED') AND a.IsDeleted = 0) AS ActiveWorkloadCount
      FROM \`User\` u
      LEFT JOIN EmployeeAssignment ea ON u.UserID = ea.UserID AND ea.IsActive = 1 AND ea.IsDeleted = 0
      LEFT JOIN UserRole ur ON u.UserID = ur.UserID
      LEFT JOIN Role r ON ur.RoleID = r.RoleID
      LEFT JOIN TechnicianAvailability ta ON u.UserID = ta.UserID
      WHERE u.IsActive = 1 AND u.IsDeleted = 0
        AND (u.UserTypeCode IN ('TECHNICIAN', 'PARK_TECHNICIAN') OR r.RoleCode = 'TECHNICIAN')
    `;

    const params = [];
    if (tenantId) {
      sql += ` AND u.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (departmentId) {
      sql += ` AND ea.DepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (search) {
      sql += ` AND (u.FirstName LIKE ? OR u.LastName LIKE ? OR u.Email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (availabilityStatus && availabilityStatus !== 'ALL') {
      sql += ` AND ta.AvailabilityStatusCode = ?`;
      params.push(availabilityStatus);
    }

    sql += ` ORDER BY FullName ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const technicians = await query(sql, params);
    return { technicians, total: technicians.length };
  },

  async updateAvailability(userId, statusCode) {
    const checkSql = `SELECT TechnicianAvailabilityID FROM TechnicianAvailability WHERE UserID = ?`;
    const rows = await query(checkSql, [userId]);

    if (rows.length > 0) {
      const sql = `
        UPDATE TechnicianAvailability
        SET AvailabilityStatusCode = ?, LastStatusChangeDateTime = CURRENT_TIMESTAMP(6)
        WHERE UserID = ?
      `;
      await query(sql, [statusCode, userId]);
    } else {
      const sql = `
        INSERT INTO TechnicianAvailability (UserID, AvailabilityStatusCode, CreatedBy)
        VALUES (?, ?, ?)
      `;
      await query(sql, [userId, statusCode, userId]);
    }
  },

  async updateLocation(userId, latitude, longitude) {
    const checkSql = `SELECT TechnicianLocationID FROM TechnicianLocation WHERE UserID = ?`;
    const rows = await query(checkSql, [userId]);

    if (rows.length > 0) {
      const sql = `
        UPDATE TechnicianLocation
        SET Latitude = ?, Longitude = ?, RecordedDateTime = CURRENT_TIMESTAMP(6)
        WHERE UserID = ?
      `;
      await query(sql, [latitude, longitude, userId]);
    } else {
      const sql = `
        INSERT INTO TechnicianLocation (UserID, Latitude, Longitude, CreatedBy)
        VALUES (?, ?, ?, ?)
      `;
      await query(sql, [userId, latitude, longitude, userId]);
    }
  }
};

export default technicianRepository;
