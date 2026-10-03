import { query } from '../../../database/connection.js';

export const servicePricingRepository = {
  async findByServiceId(serviceId) {
    const sql = `
      SELECT sp.*, s.ServiceName, s.ServiceCode
      FROM ServicePricing sp
      JOIN Service s ON sp.ServiceID = s.ServiceID
      WHERE sp.ServiceID = ? AND sp.IsDeleted = 0
    `;
    const rows = await query(sql, [serviceId]);
    return rows[0] || null;
  },

  async findById(id) {
    const sql = `
      SELECT sp.*, s.ServiceName, s.ServiceCode
      FROM ServicePricing sp
      JOIN Service s ON sp.ServiceID = s.ServiceID
      WHERE sp.ServicePricingID = ? AND sp.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async upsert(data) {
    // Check existing pricing for service
    const existing = await this.findByServiceId(data.ServiceID);
    if (existing) {
      const updateSql = `
        UPDATE ServicePricing SET
          PricingModel = COALESCE(?, PricingModel),
          UnitPrice = COALESCE(?, UnitPrice),
          CurrencyCode = COALESCE(?, CurrencyCode),
          BillingType = COALESCE(?, BillingType),
          IsActive = COALESCE(?, IsActive),
          ModifiedBy = ?,
          ModifiedDate = CURRENT_TIMESTAMP(6)
        WHERE ServicePricingID = ? AND IsDeleted = 0
      `;
      await query(updateSql, [
        data.PricingModel ?? null,
        data.UnitPrice ?? null,
        data.CurrencyCode ?? null,
        data.BillingType ?? null,
        data.IsActive ?? null,
        data.CreatedBy || 1,
        existing.ServicePricingID
      ]);
      return this.findById(existing.ServicePricingID);
    }

    const insertSql = `
      INSERT INTO ServicePricing (
        ServiceID, PricingModel, UnitPrice, CurrencyCode, BillingType, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(insertSql, [
      data.ServiceID,
      data.PricingModel || 'FLAT_RATE',
      data.UnitPrice || 0.00,
      data.CurrencyCode || 'ETB',
      data.BillingType || 'BILLABLE',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return this.findById(result.insertId);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE ServicePricing SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServicePricingID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default servicePricingRepository;
