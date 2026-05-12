import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

const populateCart = (query) => query.populate('items.product', 'name price images ratingAverage');

export const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return populateCart(Cart.findById(cart._id));
};

export const addCartItem = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);

  if (!product) throw new ApiError('Product not found.', 404);

  const cart = await getCart(userId);
  const existing = cart.items.find((item) => item.product._id.toString() === productId);

  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  return getCart(userId);
};

export const updateCartItem = async (userId, productId, quantity) => {
  const cart = await getCart(userId);
  const existing = cart.items.find((item) => item.product._id.toString() === productId);

  if (!existing) throw new ApiError('Cart item not found.', 404);

  existing.quantity = Number(quantity);
  await cart.save();
  return getCart(userId);
};

export const removeCartItem = async (userId, productId) => {
  const cart = await getCart(userId);
  cart.items = cart.items.filter((item) => item.product._id.toString() !== productId);
  await cart.save();
  return getCart(userId);
};

export const clearCart = async (userId) => {
  const cart = await getCart(userId);
  cart.items = [];
  await cart.save();
  return cart;
};
