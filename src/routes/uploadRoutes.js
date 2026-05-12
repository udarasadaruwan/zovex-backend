import express from 'express';
import { uploadProductImage } from '../controllers/uploadController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/product-image', protect, authorize('admin', 'seller'), upload.single('file'), uploadProductImage);

export default router;
