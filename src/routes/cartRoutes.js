import express from 'express';
import { addItem, emptyCart, readCart, removeItem, updateItem } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(readCart).post(addItem).delete(emptyCart);
router.route('/:productId').patch(updateItem).delete(removeItem);

export default router;
