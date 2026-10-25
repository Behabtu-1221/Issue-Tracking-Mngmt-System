import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure storage upload directory exists
const uploadDir = path.join(process.cwd(), 'src', 'storage', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter (Max 50MB per file, allow images, docs, pdfs, zips, spreadsheets, text)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed', 'text/plain', 'text/csv',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/aac'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not permitted. Allowed types: PDF, Images, Audio/Voice Notes, Word, Excel, CSV, ZIP, TXT.`), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  },
  fileFilter
});

export default uploadMiddleware;
