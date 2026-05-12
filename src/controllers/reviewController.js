import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import catchAsync from '../utils/catchAsync.js';

const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', ratingAverage: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
  ]);

  const rating = stats[0] || { ratingAverage: 0, ratingCount: 0 };
  await Product.findByIdAndUpdate(productId, {
    ratingAverage: rating.ratingAverage,
    ratingCount: rating.ratingCount
  });
};

export const getProductReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ reviews });
});

export const addReview = catchAsync(async (req, res) => {
  const review = await Review.findOneAndUpdate(
    { user: req.user._id, product: req.params.productId },
    { rating: req.body.rating, comment: req.body.comment },
    { upsert: true, new: true, runValidators: true }
  );

  await updateProductRating(review.product);
  res.status(201).json({ review });
});
