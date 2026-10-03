import { query } from '../../../database/connection.js';
import logger from '../../../shared/utils/logger.js';

class FileDocumentRepository {
  constructor() {
    this.initTables();
  }

  async initTables() {
    try {
      // 1. sys_document_categories
      await query(`
        CREATE TABLE IF NOT EXISTS sys_document_categories (
          CategoryID INT AUTO_INCREMENT PRIMARY KEY,
          CategoryCode VARCHAR(50) NOT NULL UNIQUE,
          CategoryName VARCHAR(100) NOT NULL,
          Description TEXT NULL,
          Icon VARCHAR(50) NULL DEFAULT 'Folder',
          IsActive TINYINT(1) DEFAULT 1,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed categories if empty
      const existingCats = await query(`SELECT COUNT(*) as count FROM sys_document_categories`);
      if (existingCats[0]?.count === 0) {
        await query(`
          INSERT INTO sys_document_categories (CategoryCode, CategoryName, Description, Icon) VALUES
          ('CONTRACTS', 'Legal & Contracts', 'Leases, SLAs, NDAs, and legal agreements', 'FileText'),
          ('ISSUE_ATTACHMENTS', 'Issue & Service Attachments', 'Photos, logs, and attachments linked to issue requests', 'LifeBuoy'),
          ('ASSET_DOCS', 'Asset & Facilities Docs', 'Manuals, blueprints, warranties, and inspection guides', 'Building2'),
          ('POLICIES', 'Policies & Guidelines', 'Company compliance, SOPs, and governance policies', 'ShieldCheck'),
          ('REPORTS', 'Reports & Analytics', 'Exported platform metrics, financial audits, and SLA reports', 'BarChart2'),
          ('GENERAL', 'General Documents', 'Miscellaneous administrative documents', 'Folder');
        `);
        logger.info('Seeded sys_document_categories');
      }

      // 2. sys_documents
      await query(`
        CREATE TABLE IF NOT EXISTS sys_documents (
          DocumentID INT AUTO_INCREMENT PRIMARY KEY,
          DocumentUUID VARCHAR(64) NOT NULL UNIQUE,
          Title VARCHAR(255) NOT NULL,
          Description TEXT NULL,
          CategoryID INT NULL,
          FileName VARCHAR(255) NOT NULL,
          StoredFileName VARCHAR(255) NOT NULL,
          FilePath VARCHAR(500) NOT NULL,
          MimeType VARCHAR(100) NOT NULL,
          FileExtension VARCHAR(20) NULL,
          FileSize BIGINT NOT NULL DEFAULT 0,
          EntityRefType VARCHAR(50) NULL,
          EntityRefID INT NULL,
          TenantID INT NULL,
          IsSensitive TINYINT(1) DEFAULT 0,
          IsPublic TINYINT(1) DEFAULT 0,
          CurrentVersion INT DEFAULT 1,
          DownloadCount INT DEFAULT 0,
          Tags VARCHAR(255) NULL,
          UploadedBy INT NULL,
          IsArchived TINYINT(1) DEFAULT 0,
          ArchivedAt DATETIME NULL,
          ArchivedBy INT NULL,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. sys_document_versions
      await query(`
        CREATE TABLE IF NOT EXISTS sys_document_versions (
          VersionID INT AUTO_INCREMENT PRIMARY KEY,
          DocumentID INT NOT NULL,
          VersionNumber INT NOT NULL,
          FileName VARCHAR(255) NOT NULL,
          StoredFileName VARCHAR(255) NOT NULL,
          FilePath VARCHAR(500) NOT NULL,
          FileSize BIGINT NOT NULL,
          MimeType VARCHAR(100) NOT NULL,
          ChangeNotes TEXT NULL,
          UploadedBy INT NULL,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (DocumentID) REFERENCES sys_documents(DocumentID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. sys_document_shares
      await query(`
        CREATE TABLE IF NOT EXISTS sys_document_shares (
          ShareID INT AUTO_INCREMENT PRIMARY KEY,
          ShareUUID VARCHAR(64) NOT NULL UNIQUE,
          DocumentID INT NOT NULL,
          SharedWithUserID INT NULL,
          SharedWithEmail VARCHAR(150) NULL,
          AccessLevel VARCHAR(20) DEFAULT 'VIEW',
          ExpiresAt DATETIME NULL,
          CreatedBy INT NULL,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (DocumentID) REFERENCES sys_documents(DocumentID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 5. sys_document_audit_logs
      await query(`
        CREATE TABLE IF NOT EXISTS sys_document_audit_logs (
          LogID INT AUTO_INCREMENT PRIMARY KEY,
          DocumentID INT NULL,
          Action VARCHAR(50) NOT NULL,
          ActorID INT NULL,
          IpAddress VARCHAR(45) NULL,
          Details TEXT NULL,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      logger.info('FileDocumentRepository: Tables initialized successfully');
    } catch (err) {
      logger.error(`FileDocumentRepository initTables error: ${err.message}`);
    }
  }

  // ── Metrics & Telemetry ──
  async getMetrics(tenantId = null) {
    let whereClause = `WHERE IsArchived = 0`;
    const params = [];
    if (tenantId) {
      whereClause += ` AND TenantID = ?`;
      params.push(tenantId);
    }

    const totalRes = await query(`
      SELECT 
        COUNT(*) as totalFiles,
        COALESCE(SUM(FileSize), 0) as totalStorageBytes,
        SUM(CASE WHEN IsSensitive = 1 THEN 1 ELSE 0 END) as sensitiveFiles,
        SUM(CASE WHEN IsPublic = 1 THEN 1 ELSE 0 END) as publicFiles,
        SUM(DownloadCount) as totalDownloads
      FROM sys_documents ${whereClause}
    `, params);

    const categoryStats = await query(`
      SELECT 
        c.CategoryCode, c.CategoryName, c.Icon,
        COUNT(d.DocumentID) as fileCount,
        COALESCE(SUM(d.FileSize), 0) as storageBytes
      FROM sys_document_categories c
      LEFT JOIN sys_documents d ON d.CategoryID = c.CategoryID AND d.IsArchived = 0
      GROUP BY c.CategoryID, c.CategoryCode, c.CategoryName, c.Icon
    `);

    const recentUploads = await query(`
      SELECT d.*, c.CategoryName, u.Username as UploaderName
      FROM sys_documents d
      LEFT JOIN sys_document_categories c ON d.CategoryID = c.CategoryID
      LEFT JOIN \`User\` u ON d.UploadedBy = u.UserID
      ${whereClause}
      ORDER BY d.CreatedAt DESC LIMIT 5
    `, params);

    return {
      summary: totalRes[0] || { totalFiles: 0, totalStorageBytes: 0, sensitiveFiles: 0, publicFiles: 0, totalDownloads: 0 },
      categories: categoryStats,
      recentUploads
    };
  }

  // ── Documents CRUD & Filter ──
  async findDocuments({ search, categoryId, entityRefType, entityRefId, tenantId, isArchived = 0, isSensitive, limit = 50, offset = 0 }) {
    let whereConditions = [`d.IsArchived = ?`];
    let params = [isArchived ? 1 : 0];

    if (search) {
      whereConditions.push(`(d.Title LIKE ? OR d.Description LIKE ? OR d.FileName LIKE ? OR d.Tags LIKE ?)`);
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (categoryId) {
      whereConditions.push(`d.CategoryID = ?`);
      params.push(categoryId);
    }
    if (entityRefType) {
      whereConditions.push(`d.EntityRefType = ?`);
      params.push(entityRefType);
    }
    if (entityRefId) {
      whereConditions.push(`d.EntityRefID = ?`);
      params.push(entityRefId);
    }
    if (tenantId) {
      whereConditions.push(`(d.TenantID = ? OR d.TenantID IS NULL)`);
      params.push(tenantId);
    }
    if (isSensitive !== undefined) {
      whereConditions.push(`d.IsSensitive = ?`);
      params.push(isSensitive ? 1 : 0);
    }

    const whereSql = whereConditions.join(' AND ');

    const countSql = `SELECT COUNT(*) as total FROM sys_documents d WHERE ${whereSql}`;
    const [countRes] = await query(countSql, params);

    const listSql = `
      SELECT d.*, c.CategoryName, c.CategoryCode, c.Icon as CategoryIcon,
             u.Username as UploaderName, u.FirstName as UploaderFirstName, u.LastName as UploaderLastName
      FROM sys_documents d
      LEFT JOIN sys_document_categories c ON d.CategoryID = c.CategoryID
      LEFT JOIN \`User\` u ON d.UploadedBy = u.UserID
      WHERE ${whereSql}
      ORDER BY d.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const documents = await query(listSql, [...params, Number(limit), Number(offset)]);

    return {
      total: countRes?.total || 0,
      documents
    };
  }

  async findById(documentId) {
    const sql = `
      SELECT d.*, c.CategoryName, c.CategoryCode, c.Icon as CategoryIcon,
             u.Username as UploaderName, u.Email as UploaderEmail
      FROM sys_documents d
      LEFT JOIN sys_document_categories c ON d.CategoryID = c.CategoryID
      LEFT JOIN \`User\` u ON d.UploadedBy = u.UserID
      WHERE d.DocumentID = ?
    `;
    const res = await query(sql, [documentId]);
    return res[0] || null;
  }

  async findByUUID(uuid) {
    const sql = `
      SELECT d.*, c.CategoryName, c.CategoryCode
      FROM sys_documents d
      LEFT JOIN sys_document_categories c ON d.CategoryID = c.CategoryID
      WHERE d.DocumentUUID = ?
    `;
    const res = await query(sql, [uuid]);
    return res[0] || null;
  }

  async createDocument(data) {
    const sql = `
      INSERT INTO sys_documents (
        DocumentUUID, Title, Description, CategoryID, FileName, StoredFileName,
        FilePath, MimeType, FileExtension, FileSize, EntityRefType, EntityRefID,
        TenantID, IsSensitive, IsPublic, Tags, UploadedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.DocumentUUID,
      data.Title,
      data.Description || null,
      data.CategoryID || null,
      data.FileName,
      data.StoredFileName,
      data.FilePath,
      data.MimeType,
      data.FileExtension || null,
      data.FileSize,
      data.EntityRefType || null,
      data.EntityRefID || null,
      data.TenantID || null,
      data.IsSensitive ? 1 : 0,
      data.IsPublic ? 1 : 0,
      data.Tags || null,
      data.UploadedBy || null
    ];
    const res = await query(sql, params);
    
    // Also create initial Version 1 entry
    await this.createVersion({
      DocumentID: res.insertId,
      VersionNumber: 1,
      FileName: data.FileName,
      StoredFileName: data.StoredFileName,
      FilePath: data.FilePath,
      FileSize: data.FileSize,
      MimeType: data.MimeType,
      ChangeNotes: 'Initial document upload',
      UploadedBy: data.UploadedBy
    });

    return this.findById(res.insertId);
  }

  async updateDocument(documentId, data) {
    const fields = [];
    const params = [];

    if (data.Title !== undefined) { fields.push('Title = ?'); params.push(data.Title); }
    if (data.Description !== undefined) { fields.push('Description = ?'); params.push(data.Description); }
    if (data.CategoryID !== undefined) { fields.push('CategoryID = ?'); params.push(data.CategoryID); }
    if (data.EntityRefType !== undefined) { fields.push('EntityRefType = ?'); params.push(data.EntityRefType); }
    if (data.EntityRefID !== undefined) { fields.push('EntityRefID = ?'); params.push(data.EntityRefID); }
    if (data.IsSensitive !== undefined) { fields.push('IsSensitive = ?'); params.push(data.IsSensitive ? 1 : 0); }
    if (data.IsPublic !== undefined) { fields.push('IsPublic = ?'); params.push(data.IsPublic ? 1 : 0); }
    if (data.Tags !== undefined) { fields.push('Tags = ?'); params.push(data.Tags); }

    if (fields.length === 0) return this.findById(documentId);

    params.push(documentId);
    await query(`UPDATE sys_documents SET ${fields.join(', ')} WHERE DocumentID = ?`, params);
    return this.findById(documentId);
  }

  async incrementDownloadCount(documentId) {
    await query(`UPDATE sys_documents SET DownloadCount = DownloadCount + 1 WHERE DocumentID = ?`, [documentId]);
  }

  async archiveDocument(documentId, actorId) {
    await query(
      `UPDATE sys_documents SET IsArchived = 1, ArchivedAt = NOW(), ArchivedBy = ? WHERE DocumentID = ?`,
      [actorId, documentId]
    );
    return true;
  }

  async restoreDocument(documentId) {
    await query(
      `UPDATE sys_documents SET IsArchived = 0, ArchivedAt = NULL, ArchivedBy = NULL WHERE DocumentID = ?`,
      [documentId]
    );
    return true;
  }

  async deletePermanent(documentId) {
    await query(`DELETE FROM sys_documents WHERE DocumentID = ?`, [documentId]);
    return true;
  }

  // ── Versions ──
  async createVersion(versionData) {
    const sql = `
      INSERT INTO sys_document_versions (
        DocumentID, VersionNumber, FileName, StoredFileName, FilePath, FileSize, MimeType, ChangeNotes, UploadedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      versionData.DocumentID,
      versionData.VersionNumber,
      versionData.FileName,
      versionData.StoredFileName,
      versionData.FilePath,
      versionData.FileSize,
      versionData.MimeType,
      versionData.ChangeNotes || null,
      versionData.UploadedBy || null
    ];
    await query(sql, params);

    // Update main document current version & active file info
    await query(`
      UPDATE sys_documents 
      SET CurrentVersion = ?, FileName = ?, StoredFileName = ?, FilePath = ?, FileSize = ?, MimeType = ?
      WHERE DocumentID = ?
    `, [
      versionData.VersionNumber, versionData.FileName, versionData.StoredFileName,
      versionData.FilePath, versionData.FileSize, versionData.MimeType,
      versionData.DocumentID
    ]);

    return this.findVersionsByDocumentId(versionData.DocumentID);
  }

  async findVersionsByDocumentId(documentId) {
    const sql = `
      SELECT v.*, u.Username as UploaderName
      FROM sys_document_versions v
      LEFT JOIN \`User\` u ON v.UploadedBy = u.UserID
      WHERE v.DocumentID = ?
      ORDER BY v.VersionNumber DESC
    `;
    return await query(sql, [documentId]);
  }

  // ── Shares ──
  async createShare(shareData) {
    const sql = `
      INSERT INTO sys_document_shares (
        ShareUUID, DocumentID, SharedWithUserID, SharedWithEmail, AccessLevel, ExpiresAt, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      shareData.ShareUUID,
      shareData.DocumentID,
      shareData.SharedWithUserID || null,
      shareData.SharedWithEmail || null,
      shareData.AccessLevel || 'VIEW',
      shareData.ExpiresAt || null,
      shareData.CreatedBy || null
    ];
    await query(sql, params);
    return this.findShareByUUID(shareData.ShareUUID);
  }

  async findShareByUUID(shareUuid) {
    const sql = `
      SELECT s.*, d.Title, d.FileName, d.StoredFileName, d.FilePath, d.MimeType, d.FileSize, d.IsSensitive
      FROM sys_document_shares s
      JOIN sys_documents d ON s.DocumentID = d.DocumentID
      WHERE s.ShareUUID = ?
    `;
    const res = await query(sql, [shareUuid]);
    return res[0] || null;
  }

  // ── Categories ──
  async getCategories() {
    return await query(`SELECT * FROM sys_document_categories WHERE IsActive = 1 ORDER BY CategoryName ASC`);
  }

  async createCategory(data) {
    const sql = `INSERT INTO sys_document_categories (CategoryCode, CategoryName, Description, Icon) VALUES (?, ?, ?, ?)`;
    const res = await query(sql, [data.CategoryCode, data.CategoryName, data.Description || null, data.Icon || 'Folder']);
    return res.insertId;
  }

  // ── Audit Logs ──
  async logAudit(documentId, action, actorId, ipAddress, details) {
    const sql = `INSERT INTO sys_document_audit_logs (DocumentID, Action, ActorID, IpAddress, Details) VALUES (?, ?, ?, ?, ?)`;
    await query(sql, [documentId, action, actorId || null, ipAddress || null, details || null]);
  }
}

export default new FileDocumentRepository();
