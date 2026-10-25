import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import fileDocumentRepository from '../repositories/file-document.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import logger from '../../../shared/utils/logger.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  return [
    'SUPER_ADMIN',
    'PARK_ADMIN',
    'PARK_SUPER_ADMIN',
    'BUSINESS_PARK_ADMIN',
    'DEPARTMENT_MANAGER',
    'MANAGER',
    'DISPATCHER',
    'PARK_DISPATCHER',
    'TECHNICIAN',
    'PARK_TECHNICIAN',
    'PARK_STAFF',
    'STAFF'
  ].includes(code);
};

class FileDocumentService {
  // ── Metrics ──
  async getMetrics(tenantId, actor) {
    const effectiveTenantId = isParkAdminActor(actor) ? tenantId : actor?.tenantId;
    return await fileDocumentRepository.getMetrics(effectiveTenantId);
  }

  // ── Document Queries ──
  async listDocuments(queryOptions = {}) {
    const options = { ...queryOptions };
    if (!isParkAdminActor(options.actor) && options.actor?.tenantId) {
      options.tenantId = options.actor.tenantId;
    }
    return await fileDocumentRepository.findDocuments(options);
  }

  async getDocumentById(documentId, actor) {
    const isUUID = typeof documentId === 'string' && (documentId.includes('-') || isNaN(Number(documentId)));
    const doc = isUUID
      ? await fileDocumentRepository.findByUUID(documentId)
      : await fileDocumentRepository.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404);

    if (!isParkAdminActor(actor) && doc.TenantID && doc.TenantID !== actor?.tenantId) {
      throw new AppError('Document not found', 404);
    }
    
    // Fetch version history
    const versions = await fileDocumentRepository.findVersionsByDocumentId(doc.DocumentID);
    return { ...doc, versions };
  }

  async getDocumentByUUID(uuid, actor) {
    const doc = await fileDocumentRepository.findByUUID(uuid);
    if (!doc) throw new AppError('Document not found', 404);
    if (!isParkAdminActor(actor) && doc.TenantID && doc.TenantID !== actor?.tenantId) {
      throw new AppError('Document not found', 404);
    }
    return doc;
  }

  // ── File Upload ──
  async uploadFile(file, metadata, uploaderId, actor) {
    if (!file) throw new AppError('No file was uploaded', 400);

    const documentUUID = crypto.randomUUID();
    const fileExt = path.extname(file.originalname).replace('.', '').toLowerCase();

    const tenantId = isParkAdminActor(actor)
      ? (metadata.tenantId ? parseInt(metadata.tenantId, 10) : actor?.tenantId)
      : actor?.tenantId;

    const docData = {
      DocumentUUID: documentUUID,
      Title: metadata.title || file.originalname,
      Description: metadata.description || '',
      CategoryID: metadata.categoryId ? parseInt(metadata.categoryId, 10) : null,
      FileName: file.originalname,
      StoredFileName: file.filename,
      FilePath: file.path,
      MimeType: file.mimetype,
      FileExtension: fileExt,
      FileSize: file.size,
      EntityRefType: metadata.entityRefType || null,
      EntityRefID: metadata.entityRefId ? parseInt(metadata.entityRefId, 10) : null,
      TenantID: tenantId || null,
      IsSensitive: metadata.isSensitive === 'true' || metadata.isSensitive === true ? 1 : 0,
      IsPublic: metadata.isPublic === 'true' || metadata.isPublic === true ? 1 : 0,
      Tags: metadata.tags || '',
      UploadedBy: uploaderId
    };

    const newDoc = await fileDocumentRepository.createDocument(docData);

    await fileDocumentRepository.logAudit(
      newDoc.DocumentID,
      'UPLOAD',
      uploaderId,
      metadata.ipAddress || null,
      `Uploaded initial file "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB)`
    );

    return newDoc;
  }

  // ── New Version Upload ──
  async addVersion(documentId, file, changeNotes, uploaderId, actor) {
    const doc = await this.getDocumentById(documentId, actor);
    if (!file) throw new AppError('No file provided for new version', 400);

    const nextVersionNumber = (doc.CurrentVersion || 1) + 1;

    const versionData = {
      DocumentID: documentId,
      VersionNumber: nextVersionNumber,
      FileName: file.originalname,
      StoredFileName: file.filename,
      FilePath: file.path,
      FileSize: file.size,
      MimeType: file.mimetype,
      ChangeNotes: changeNotes || `Updated to version ${nextVersionNumber}`,
      UploadedBy: uploaderId
    };

    await fileDocumentRepository.createVersion(versionData);

    await fileDocumentRepository.logAudit(
      documentId,
      'UPDATE_VERSION',
      uploaderId,
      null,
      `Added Version ${nextVersionNumber}: ${file.originalname}`
    );

    return await this.getDocumentById(documentId, actor);
  }

  // ── Download & Stream ──
  async getDownloadStream(documentId, actorId, ipAddress, actor) {
    const doc = await this.getDocumentById(documentId, actor);
    if (doc.IsArchived) throw new AppError('Document is archived', 410);

    if (!fs.existsSync(doc.FilePath)) {
      throw new AppError('File content is missing from disk storage', 404);
    }

    await fileDocumentRepository.incrementDownloadCount(doc.DocumentID);
    await fileDocumentRepository.logAudit(doc.DocumentID, 'DOWNLOAD', actorId, ipAddress, `Downloaded ${doc.FileName}`);

    return {
      stream: fs.createReadStream(doc.FilePath),
      fileName: doc.FileName,
      mimeType: doc.MimeType,
      fileSize: doc.FileSize
    };
  }

  async getPreviewStream(documentId, actorId, actor) {
    const doc = await this.getDocumentById(documentId, actor);
    if (!fs.existsSync(doc.FilePath)) {
      throw new AppError('File not found on storage disk', 404);
    }

    await fileDocumentRepository.logAudit(doc.DocumentID, 'VIEW', actorId, null, `Previewed file ${doc.FileName}`);

    return {
      stream: fs.createReadStream(doc.FilePath),
      fileName: doc.FileName,
      mimeType: doc.MimeType,
      fileSize: doc.FileSize,
      filePath: doc.FilePath
    };
  }

  // ── Share Link ──
  // ── Share Link ──
  async createShareLink(documentId, shareData, creatorId, actor) {
    const doc = await this.getDocumentById(documentId, actor);

    const shareUUID = crypto.randomUUID();
    const share = await fileDocumentRepository.createShare({
      ShareUUID: shareUUID,
      DocumentID: documentId,
      SharedWithUserID: shareData.sharedWithUserId || null,
      SharedWithEmail: shareData.sharedWithEmail || null,
      AccessLevel: shareData.accessLevel || 'VIEW',
      ExpiresAt: shareData.expiresAt || null,
      CreatedBy: creatorId
    });

    await fileDocumentRepository.logAudit(
      documentId,
      'SHARE',
      creatorId,
      null,
      `Generated share link (Token: ${shareUUID})`
    );

    return share;
  }

  async getShareByToken(shareToken) {
    const share = await fileDocumentRepository.findShareByUUID(shareToken);
    if (!share) throw new AppError('Share link not found or expired', 404);

    if (share.ExpiresAt && new Date(share.ExpiresAt) < new Date()) {
      throw new AppError('This share link has expired', 410);
    }

    return share;
  }

  // ── Metadata Update ──
  async updateDocument(documentId, updateData, actorId, actor) {
    const doc = await this.getDocumentById(documentId, actor);

    const updated = await fileDocumentRepository.updateDocument(documentId, updateData);
    await fileDocumentRepository.logAudit(documentId, 'UPDATE_METADATA', actorId, null, `Updated document metadata`);
    return updated;
  }

  // ── Archiving & Deletion ──
  async archiveDocument(documentId, actorId, actor) {
    const doc = await this.getDocumentById(documentId, actor);

    await fileDocumentRepository.archiveDocument(documentId, actorId);
    await fileDocumentRepository.logAudit(documentId, 'ARCHIVE', actorId, null, `Archived document`);
    return { message: 'Document archived successfully' };
  }

  async restoreDocument(documentId, actorId, actor) {
    await this.getDocumentById(documentId, actor);
    await fileDocumentRepository.restoreDocument(documentId);
    await fileDocumentRepository.logAudit(documentId, 'RESTORE', actorId, null, `Restored document from archive`);
    return { message: 'Document restored successfully' };
  }

  async deletePermanent(documentId, actorId, actor) {
    const doc = await this.getDocumentById(documentId, actor);

    // Remove file from disk
    if (fs.existsSync(doc.FilePath)) {
      try {
        fs.unlinkSync(doc.FilePath);
      } catch (err) {
        logger.error(`Failed to delete disk file ${doc.FilePath}: ${err.message}`);
      }
    }

    await fileDocumentRepository.deletePermanent(documentId);
    return { message: 'Document permanently deleted' };
  }

  // ── Categories ──
  async getCategories() {
    return await fileDocumentRepository.getCategories();
  }

  async createCategory(categoryData) {
    if (!categoryData.CategoryCode || !categoryData.CategoryName) {
      throw new AppError('CategoryCode and CategoryName are required', 400);
    }
    const catId = await fileDocumentRepository.createCategory(categoryData);
    return { CategoryID: catId, ...categoryData };
  }
}

export default new FileDocumentService();
