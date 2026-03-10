"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
router.post('/image', auth_middleware_1.authenticateToken, upload_controller_1.upload.single('image'), upload_controller_1.uploadImage);
router.post('/video', auth_middleware_1.authenticateToken, upload_controller_1.uploadVideoMiddleware.single('video'), upload_controller_1.uploadVideo);
exports.default = router;
