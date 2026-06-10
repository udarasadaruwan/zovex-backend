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

const editableProductFields = [
  'name',
  'description',
  'brand',
  'price',
  'category',
  'images',
  'quantity',
  'sku',
  'lowStockThreshold'
];

const pickEditableProductFields = (payload) =>
  Object.fromEntries(
    editableProductFields
      .filter((field) => payload[field] !== undefined)
      .map((field) => [field, payload[field]])
  );

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
  const product = await Product.findOne({ _id: id, isActive: true }).populate('category', 'name slug');
  const inventory = await Inventory.findOne({ product: id });

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  return { ...product.toObject(), inventory };
};

export const createProduct = async (payload, sellerId) => {
  const productPayload = pickEditableProductFields(payload);
  const category = await Category.findOne({ _id: productPayload.category, isActive: true });

  if (!category) {
    throw new ApiError('Selected category does not exist.', 400);
  }

  const product = await Product.create({
    ...productPayload,
    seller: sellerId,
    slug: slugify(productPayload.name)
  });

  await Inventory.create({
    product: product._id,
    quantity: productPayload.quantity ?? 0,
    sku: productPayload.sku,
    lowStockThreshold: productPayload.lowStockThreshold ?? 5
  });

  return getProductById(product._id);
};

export const updateProduct = async (id, payload) => {
  const editableFields = pickEditableProductFields(payload);
  const { quantity, sku, lowStockThreshold, ...updatePayload } = editableFields;

  if (updatePayload.category) {
    const category = await Category.findOne({ _id: updatePayload.category, isActive: true });

    if (!category) {
      throw new ApiError('Selected category does not exist.', 400);
    }
  }

  if (payload.name) {
    updatePayload.slug = slugify(payload.name);
  }

  const product = await Product.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  if (quantity !== undefined || sku !== undefined || lowStockThreshold !== undefined) {
    const inventoryUpdates = {
      ...(quantity !== undefined && { quantity }),
      ...(sku !== undefined && { sku }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold })
    };

    await Inventory.findOneAndUpdate(
      { product: id },
      inventoryUpdates,
      { upsert: true, new: true, runValidators: true }
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
