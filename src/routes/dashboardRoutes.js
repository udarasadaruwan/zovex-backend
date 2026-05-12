import express from 'express';
import {
  getAdminDashboard,
  getSellerDashboard,
  getUserDashboard
} from '../controllers/dashboardController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/seller', authorize('seller'), getSellerDashboard);
router.get('/user', authorize('user'), getUserDashboard);

export default router;
