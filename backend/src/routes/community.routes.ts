import { Router } from 'express';
import { authenticateToken, authenticateOptional } from '../middlewares/auth.middleware';
import { getFeed, createPost, toggleLike, getComments, addComment, updatePost, deletePost } from '../controllers/community.controller';

const router = Router();

// Public (or semi-public)
router.get('/feed', authenticateOptional, getFeed); // Authenticate optional depending on logic, but easier for likes
router.get('/posts/:id/comments', getComments);

// Protected
router.post('/posts', authenticateToken, createPost);
router.put('/posts/:id', authenticateToken, updatePost);
router.delete('/posts/:id', authenticateToken, deletePost);
router.post('/posts/:id/like', authenticateToken, toggleLike);
router.post('/posts/:id/comments', authenticateToken, addComment);

export const communityRoutes = router;
