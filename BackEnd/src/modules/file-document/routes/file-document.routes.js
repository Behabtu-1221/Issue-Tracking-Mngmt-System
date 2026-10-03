import { Router } from 'express';
import fileDocumentController from '../controllers/file-document.controller.js';
import uploadMiddleware from '../middleware/upload.middleware.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';

const router = Router();

// Public / Token-based share link retrieval
router.get('/share/:shareToken', fileDocumentController.getShareByToken);

// All other endpoints require authentication and data scoping
router.use(authenticate);
router.use(dataScope);

// ── Metrics & Categories ──
router.get('/metrics', fileDocumentController.getMetrics);
router.get('/categories', fileDocumentController.getCategories);
router.post('/categories', authorizePermissions('Document.Manage', 'Document.Write'), fileDocumentController.createCategory);

// ── Search & Document List ──
router.get('/', fileDocumentController.listDocuments);
router.get('/:id', fileDocumentController.getDocumentById);

// ── File Uploads ──
router.post('/upload', uploadMiddleware.single('file'), fileDocumentController.uploadFile);
router.post('/upload-multiple', uploadMiddleware.array('files', 10), fileDocumentController.uploadMultipleFiles);

// ── Download & Stream ──
router.get('/:id/download', fileDocumentController.downloadFile);
router.get('/:id/preview', fileDocumentController.previewFile);

// ── Versions ──
router.post('/:id/versions', uploadMiddleware.single('file'), fileDocumentController.addVersion);

// ── Shares ──
router.post('/:id/share', fileDocumentController.createShare);

// ── Metadata Update, Archive, Restore, Delete ──
router.patch('/:id', authorizePermissions('Document.Write', 'Document.Manage'), fileDocumentController.updateDocument);
router.delete('/:id', authorizePermissions('Document.Delete', 'Document.Manage'), fileDocumentController.archiveDocument);
router.post('/:id/restore', authorizePermissions('Document.Manage'), fileDocumentController.restoreDocument);
router.delete('/:id/permanent', authorizePermissions('Document.Manage'), fileDocumentController.deletePermanent);

export default router;
