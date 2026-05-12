import Category from '../models/Category.js';
import catchAsync from '../utils/catchAsync.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getCategories = catchAsync(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ categories });
});

export const addCategory = catchAsync(async (req, res) => {
  const category = await Category.create({
    ...req.body,
    slug: req.body.slug || slugify(req.body.name)
  });
  res.status(201).json({ category });
});

export const editCategory = catchAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.json({ category });
});

export const removeCategory = catchAsync(async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.status(204).send();
});
