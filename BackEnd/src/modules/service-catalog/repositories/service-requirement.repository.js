import { query } from '../../../database/connection.js';

export const serviceRequirementRepository = {
  // ── Form Field Requirements ──
  async findRequirementsByServiceId(serviceId) {
    const sql = `
      SELECT sr.*
      FROM ServiceRequirement sr
      WHERE sr.ServiceID = ? AND sr.IsDeleted = 0
      ORDER BY sr.DisplayOrder ASC, sr.ServiceRequirementID ASC
    `;
    return query(sql, [serviceId]);
  },

  async findRequirementById(id) {
    const sql = `SELECT * FROM ServiceRequirement WHERE ServiceRequirementID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async createRequirement(data) {
    const sql = `
      INSERT INTO ServiceRequirement (
        ServiceID, FieldName, FieldLabel, FieldType, IsRequired, ValidationRegex, DataSourceJson, DisplayOrder, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceID,
      data.FieldName,
      data.FieldLabel,
      data.FieldType || 'TEXT',
      data.IsRequired !== undefined ? data.IsRequired : 0,
      data.ValidationRegex || null,
      data.DataSourceJson ? JSON.stringify(data.DataSourceJson) : null,
      data.DisplayOrder || 0,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async updateRequirement(id, data) {
    const sql = `
      UPDATE ServiceRequirement SET
        FieldLabel = COALESCE(?, FieldLabel),
        FieldType = COALESCE(?, FieldType),
        IsRequired = COALESCE(?, IsRequired),
        ValidationRegex = COALESCE(?, ValidationRegex),
        DataSourceJson = COALESCE(?, DataSourceJson),
        DisplayOrder = COALESCE(?, DisplayOrder),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceRequirementID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.FieldLabel ?? null,
      data.FieldType ?? null,
      data.IsRequired ?? null,
      data.ValidationRegex ?? null,
      data.DataSourceJson ? JSON.stringify(data.DataSourceJson) : null,
      data.DisplayOrder ?? null,
      data.IsActive ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findRequirementById(id);
  },

  async deleteRequirement(id, userId) {
    const sql = `
      UPDATE ServiceRequirement SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceRequirementID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ── Attachment Requirements ──
  async findAttachmentsByServiceId(serviceId) {
    const sql = `
      SELECT sar.*
      FROM ServiceAttachmentRequirement sar
      WHERE sar.ServiceID = ? AND sar.IsDeleted = 0
      ORDER BY sar.CreatedDate ASC
    `;
    return query(sql, [serviceId]);
  },

  async findAttachmentById(id) {
    const sql = `SELECT * FROM ServiceAttachmentRequirement WHERE ServiceAttachmentRequirementID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async createAttachment(data) {
    const sql = `
      INSERT INTO ServiceAttachmentRequirement (
        ServiceID, AttachmentName, Description, IsRequired, AllowedExtensions, MaxFileSizeMB, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceID,
      data.AttachmentName,
      data.Description || null,
      data.IsRequired !== undefined ? data.IsRequired : 0,
      data.AllowedExtensions || 'pdf,jpg,png,docx',
      data.MaxFileSizeMB || 10,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async updateAttachment(id, data) {
    const sql = `
      UPDATE ServiceAttachmentRequirement SET
        AttachmentName = COALESCE(?, AttachmentName),
        Description = COALESCE(?, Description),
        IsRequired = COALESCE(?, IsRequired),
        AllowedExtensions = COALESCE(?, AllowedExtensions),
        MaxFileSizeMB = COALESCE(?, MaxFileSizeMB),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceAttachmentRequirementID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.AttachmentName ?? null,
      data.Description ?? null,
      data.IsRequired ?? null,
      data.AllowedExtensions ?? null,
      data.MaxFileSizeMB ?? null,
      data.IsActive ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findAttachmentById(id);
  },

  async deleteAttachment(id, userId) {
    const sql = `
      UPDATE ServiceAttachmentRequirement SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceAttachmentRequirementID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default serviceRequirementRepository;
