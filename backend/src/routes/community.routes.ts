import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getFeed, createPost, toggleLike, getComments, addComment } from '../controllers/community.controller';

const router = Router();

// Public (or semi-public)
router.get('/feed', authenticateToken, getFeed); // Authenticate optional depending on logic, but easier for likes
router.get('/posts/:id/comments', getComments);

// Protected
router.post('/posts', authenticateToken, createPost);
router.post('/posts/:id/like', authenticateToken, toggleLike);
router.post('/posts/:id/comments', authenticateToken, addComment);

export const communityRoutes = router;
