import express from 'express';
import {
  addCategory,
  editCategory,
  getCategories,
  removeCategory
} from '../controllers/categoryController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(protect, authorize('admin'), addCategory);
router
  .route('/:id')
  .patch(protect, authorize('admin'), editCategory)
  .delete(protect, authorize('admin'), removeCategory);

export default router;
