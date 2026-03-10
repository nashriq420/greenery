"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const community_controller_1 = require("../controllers/community.controller");
const router = (0, express_1.Router)();
// Public (or semi-public)
router.get('/feed', auth_middleware_1.authenticateOptional, community_controller_1.getFeed); // Authenticate optional depending on logic, but easier for likes
router.get('/posts/:id/comments', community_controller_1.getComments);
// Protected
router.post('/posts', auth_middleware_1.authenticateToken, community_controller_1.createPost);
router.put('/posts/:id', auth_middleware_1.authenticateToken, community_controller_1.updatePost);
router.delete('/posts/:id', auth_middleware_1.authenticateToken, community_controller_1.deletePost);
router.post('/posts/:id/like', auth_middleware_1.authenticateToken, community_controller_1.toggleLike);
router.post('/posts/:id/comments', auth_middleware_1.authenticateToken, community_controller_1.addComment);
exports.communityRoutes = router;
