import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const listProducts = async ({ keyword, category, featured }) => {
  const query = { isActive: true };

  if (keyword) query.name = { $regex: keyword, $options: 'i' };
  if (category) query.category = category;
  if (featured !== undefined) query.isFeatured = featured === 'true';

  return Product.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
};

export const listSellerProducts = async (sellerId) => {
  return Product.find({ seller: sellerId, isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
};

export const getProductById = async (id) => {
  const product = await Product.findById(id).populate('category', 'name slug');
  const inventory = await Inventory.findOne({ product: id });

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  return { ...product.toObject(), inventory };
};

export const createProduct = async (payload, sellerId) => {
  const category = await Category.findById(payload.category);

  if (!category) {
    throw new ApiError('Selected category does not exist.', 400);
  }

  const product = await Product.create({
    ...payload,
    seller: sellerId,
    slug: payload.slug || slugify(payload.name)
  });

  await Inventory.create({
    product: product._id,
    quantity: payload.quantity || 0,
    sku: payload.sku,
    lowStockThreshold: payload.lowStockThreshold || 5
  });

  return getProductById(product._id);
};

export const updateProduct = async (id, payload) => {
  const updatePayload = { ...payload };

  if (payload.name) {
    updatePayload.slug = slugify(payload.name);
  }

  const product = await Product.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  if (payload.quantity !== undefined) {
    await Inventory.findOneAndUpdate(
      { product: id },
      { quantity: payload.quantity },
      { upsert: true, new: true }
    );
  }

  return getProductById(id);
};

export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  return product;
};
