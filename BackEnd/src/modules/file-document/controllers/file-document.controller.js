import fs from 'fs';
import path from 'path';
import fileDocumentService from '../services/file-document.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const fileDocumentController = {
  // ── Metrics ──
  async getMetrics(req, res, next) {
    try {
      const data = await fileDocumentService.getMetrics(req.query.tenantId, req.actor);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Document List & Search ──
  async listDocuments(req, res, next) {
    try {
      const options = {
        search: req.query.search,
        categoryId: req.query.categoryId,
        entityRefType: req.query.entityRefType,
        entityRefId: req.query.entityRefId,
        tenantId: req.query.tenantId,
        isArchived: req.query.isArchived === 'true' || req.query.isArchived === '1' ? 1 : 0,
        isSensitive: req.query.isSensitive !== undefined ? (req.query.isSensitive === 'true') : undefined,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0,
        actor: req.actor
      };
      const data = await fileDocumentService.listDocuments(options);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Document Detail ──
  async getDocumentById(req, res, next) {
    try {
      const data = await fileDocumentService.getDocumentById(req.params.id, req.actor);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Single File Upload ──
  async uploadFile(req, res, next) {
    try {
      const uploaderId = req.actor?.userId || 1;
      const metadata = { ...req.body, ipAddress: req.ip };
      const data = await fileDocumentService.uploadFile(req.file, metadata, uploaderId, req.actor);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  // ── Multi File Upload ──
  async uploadMultipleFiles(req, res, next) {
    try {
      const uploaderId = req.actor?.userId || 1;
      const metadata = { ...req.body, ipAddress: req.ip };
      const files = req.files || [];

      const results = [];
      for (const file of files) {
        const doc = await fileDocumentService.uploadFile(file, metadata, uploaderId, req.actor);
        results.push(doc);
      }

      return sendSuccess(res, { uploadedCount: results.length, documents: results }, 201);
    } catch (err) {
      next(err);
    }
  },

  // ── Add New Version ──
  async addVersion(req, res, next) {
    try {
      const uploaderId = req.actor?.userId || 1;
      const data = await fileDocumentService.addVersion(
        req.params.id,
        req.file,
        req.body.changeNotes,
        uploaderId,
        req.actor
      );
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  // ── Download File Stream ──
  async downloadFile(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const { stream, fileName, mimeType, fileSize } = await fileDocumentService.getDownloadStream(
        req.params.id,
        actorId,
        req.ip,
        req.actor
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      if (fileSize) res.setHeader('Content-Length', fileSize);

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  // ── Preview File Stream ──
  async previewFile(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const { stream, fileName, mimeType, fileSize, filePath } = await fileDocumentService.getPreviewStream(
        req.params.id,
        actorId,
        req.actor
      );

      let effectiveMime = mimeType;
      if (!effectiveMime || effectiveMime === 'application/octet-stream') {
        const ext = path.extname(fileName || '').toLowerCase();
        if (ext === '.webm') effectiveMime = 'audio/webm';
        else if (ext === '.mp3') effectiveMime = 'audio/mpeg';
        else if (ext === '.wav') effectiveMime = 'audio/wav';
        else if (ext === '.ogg') effectiveMime = 'audio/ogg';
        else if (ext === '.m4a') effectiveMime = 'audio/mp4';
        else if (ext === '.aac') effectiveMime = 'audio/aac';
        else if (ext === '.png') effectiveMime = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') effectiveMime = 'image/jpeg';
        else if (ext === '.pdf') effectiveMime = 'application/pdf';
      }

      const range = req.headers.range;
      if (range && fileSize && filePath && fs.existsSync(filePath)) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Type', effectiveMime || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

        const partialStream = fs.createReadStream(filePath, { start, end });
        return partialStream.pipe(res);
      }

      res.setHeader('Content-Type', effectiveMime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      if (fileSize) res.setHeader('Content-Length', fileSize);

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  // ── Create Share Link ──
  async createShare(req, res, next) {
    try {
      const creatorId = req.actor?.userId || req.user?.id || 1;
      const data = await fileDocumentService.createShareLink(req.params.id, req.body, creatorId, req.actor);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  // ── Access Share Link ──
  async getShareByToken(req, res, next) {
    try {
      const data = await fileDocumentService.getShareByToken(req.params.shareToken);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Update Metadata ──
  async updateDocument(req, res, next) {
    try {
      const actorId = req.actor?.userId || req.user?.id || 1;
      const data = await fileDocumentService.updateDocument(req.params.id, req.body, actorId, req.actor);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Archive Document ──
  async archiveDocument(req, res, next) {
    try {
      const actorId = req.actor?.userId || req.user?.id || 1;
      const data = await fileDocumentService.archiveDocument(req.params.id, actorId, req.actor);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Restore Document ──
  async restoreDocument(req, res, next) {
    try {
      const actorId = req.actor?.userId || req.user?.id || 1;
      const data = await fileDocumentService.restoreDocument(req.params.id, actorId, req.actor);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Permanent Delete ──
  async deletePermanent(req, res, next) {
    try {
      const actorId = req.actor?.userId || req.user?.id || 1;
      const data = await fileDocumentService.deletePermanent(req.params.id, actorId, req.actor);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // ── Categories ──
  async getCategories(req, res, next) {
    try {
      const data = await fileDocumentService.getCategories();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const data = await fileDocumentService.createCategory(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }
};

export default fileDocumentController;
