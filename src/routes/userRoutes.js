import express from 'express';
import {
  deleteProfileImage,
  listUsers,
  sendProfilePasswordOtp,
  updatePassword,
  updateProfile,
  updateUserRole,
  uploadProfileImage
} from '../controllers/userController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.patch('/profile', updateProfile);
router.post('/profile/password-otp', sendProfilePasswordOtp);
router.patch('/profile/password', updatePassword);
router.patch('/profile/avatar', upload.single('file'), uploadProfileImage);
router.delete('/profile/avatar', deleteProfileImage);
router.get('/', authorize('admin'), listUsers);
router.patch('/:id/role', authorize('admin'), updateUserRole);

export default router;
