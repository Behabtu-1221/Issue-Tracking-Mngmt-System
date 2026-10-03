import { query } from '../../../database/connection.js';

export const floorPlanRepository = {
  async findByFloorId(floorId) {
    const sql = `
      SELECT fp.*,
        f.FloorName, f.FloorNumber, b.BuildingName
      FROM FloorPlan fp
      JOIN Floor f ON fp.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE fp.FloorID = ? AND fp.IsDeleted = 0
    `;
    const rows = await query(sql, [floorId]);
    return rows[0] || null;
  },

  async findById(id) {
    const sql = `
      SELECT fp.*,
        f.FloorName, f.FloorNumber, b.BuildingName
      FROM FloorPlan fp
      JOIN Floor f ON fp.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE fp.FloorPlanID = ? AND fp.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO FloorPlan (
        FloorID, FloorPlanCode, FloorPlanName, FilePath, MimeType,
        FileSizeKB, ScaleFactor, MetadataJson, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.FloorID,
      data.FloorPlanCode,
      data.FloorPlanName,
      data.FilePath,
      data.MimeType || null,
      data.FileSizeKB || null,
      data.ScaleFactor || 1.0,
      data.MetadataJson ? JSON.stringify(data.MetadataJson) : null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE FloorPlan SET
        FloorPlanCode = COALESCE(?, FloorPlanCode),
        FloorPlanName = COALESCE(?, FloorPlanName),
        FilePath = COALESCE(?, FilePath),
        MimeType = COALESCE(?, MimeType),
        FileSizeKB = COALESCE(?, FileSizeKB),
        ScaleFactor = COALESCE(?, ScaleFactor),
        MetadataJson = COALESCE(?, MetadataJson),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE FloorPlanID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.FloorPlanCode,
      data.FloorPlanName,
      data.FilePath,
      data.MimeType,
      data.FileSizeKB,
      data.ScaleFactor,
      data.MetadataJson ? JSON.stringify(data.MetadataJson) : null,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE FloorPlan SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE FloorPlanID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default floorPlanRepository;
