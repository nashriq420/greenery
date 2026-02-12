import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads/evidence directory exists
const uploadDir = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize original name to remove potential issues
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, 'evidence-' + uniqueSuffix + '-' + safeName);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    // Allowed Mime Types
    const allowedTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        // Videos
        'video/mp4', 'video/webm', 'video/quicktime',
        // Documents
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'text/plain' // .txt
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: Images, Videos, PDF, DOC, DOCX, TXT'), false);
    }
};

export const uploadEvidenceMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
