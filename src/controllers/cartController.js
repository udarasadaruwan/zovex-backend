import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem
} from '../services/cartService.js';
import catchAsync from '../utils/catchAsync.js';

export const readCart = catchAsync(async (req, res) => {
  const cart = await getCart(req.user._id);
  res.json({ cart });
});

export const addItem = catchAsync(async (req, res) => {
  const cart = await addCartItem(req.user._id, req.body.productId, req.body.quantity);
  res.status(201).json({ cart });
});

export const updateItem = catchAsync(async (req, res) => {
  const cart = await updateCartItem(req.user._id, req.params.productId, req.body.quantity);
  res.json({ cart });
});

export const removeItem = catchAsync(async (req, res) => {
  const cart = await removeCartItem(req.user._id, req.params.productId);
  res.json({ cart });
});

export const emptyCart = catchAsync(async (req, res) => {
  const cart = await clearCart(req.user._id);
  res.json({ cart });
});
