import {
  createProduct,
  deleteProduct,
  getProductById,
  listSellerProducts,
  listProducts,
  updateProduct
} from '../services/productService.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

const ensureSellerOwnsProduct = async (user, productId) => {
  if (user.role !== 'seller') return;

  const product = await Product.findById(productId).select('seller');

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  if (product.seller?.toString() !== user._id.toString()) {
    throw new ApiError('Sellers can only manage their own products.', 403);
  }
};

export const getProducts = catchAsync(async (req, res) => {
  const products = await listProducts(req.query);
  res.json({ products });
});

export const getMyProducts = catchAsync(async (req, res) => {
  const products = await listSellerProducts(req.user._id);
  res.json({ products });
});

export const getProduct = catchAsync(async (req, res) => {
  const product = await getProductById(req.params.id);
  res.json({ product });
});

export const addProduct = catchAsync(async (req, res) => {
  const product = await createProduct(req.body, req.user._id);
  res.status(201).json({ product });
});

export const editProduct = catchAsync(async (req, res) => {
  await ensureSellerOwnsProduct(req.user, req.params.id);
  const product = await updateProduct(req.params.id, req.body);
  res.json({ product });
});

export const removeProduct = catchAsync(async (req, res) => {
  await ensureSellerOwnsProduct(req.user, req.params.id);
  await deleteProduct(req.params.id);
  res.status(204).send();
});
