import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload, uploadImage } from '../controllers/upload.controller';

const router = Router();

router.post('/image', authenticateToken, upload.single('image'), uploadImage);

export default router;
