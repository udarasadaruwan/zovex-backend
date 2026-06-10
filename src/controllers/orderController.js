import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import { createOrder, listUserOrders, updateOrderStatus } from '../services/orderService.js';
import catchAsync from '../utils/catchAsync.js';

export const addOrder = catchAsync(async (req, res) => {
  const order = await createOrder(req.user, req.body);
  res.status(201).json({ order });
});

export const myOrders = catchAsync(async (req, res) => {
  const orders = await listUserOrders(req.user._id);
  res.json({ orders });
});

export const getOrder = catchAsync(async (req, res) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const order = await Order.findOne(filter).populate('items.product', 'name images');

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  res.json({ order });
});

export const editOrderStatus = catchAsync(async (req, res) => {
  const order = await updateOrderStatus(req.params.id, req.body.status, req.user);
  res.json({ order });
});
