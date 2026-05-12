import express from 'express';
import {
  addProduct,
  editProduct,
  getMyProducts,
  getProduct,
  getProducts,
  removeProduct
} from '../controllers/productController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, authorize('admin', 'seller'), addProduct);
router.get('/seller/mine', protect, authorize('seller'), getMyProducts);
router
  .route('/:id')
  .get(getProduct)
  .patch(protect, authorize('admin', 'seller'), editProduct)
  .delete(protect, authorize('admin', 'seller'), removeProduct);

export default router;
