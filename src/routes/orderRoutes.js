import express from 'express';
import { addOrder, editOrderStatus, getOrder, myOrders } from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.route('/').post(addOrder).get(myOrders);
router.route('/:id').get(getOrder);
router.patch('/:id/status', authorize('admin'), editOrderStatus);

export default router;
