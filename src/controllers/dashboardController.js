import Cart from '../models/Cart.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

export const getAdminDashboard = catchAsync(async (_req, res) => {
  const revenueStatuses = ['paid', 'processing', 'shipped', 'delivered'];
  const [
    users,
    sellers,
    products,
    categories,
    orders,
    reviews,
    paidOrders,
    pendingOrders,
    revenueStats,
    ratingStats,
    recentOrders,
    recentReviews,
    topProducts
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'seller' }),
    Product.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Review.countDocuments(),
    Order.countDocuments({ status: { $in: revenueStatuses } }),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: { $in: revenueStatuses } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]),
    Review.aggregate([{ $group: { _id: null, averageRating: { $avg: '$rating' } } }]),
    Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('user total status items createdAt shippingAddress'),
    Review.find()
      .populate('user', 'name avatar')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
    Product.find({ isActive: true })
      .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
      .limit(5)
      .select('name price ratingAverage ratingCount')
  ]);

  res.json({
    dashboard: {
      role: 'admin',
      stats: { users, sellers, products, categories, orders, reviews },
      analytics: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        paidOrders,
        pendingOrders,
        averageRating: ratingStats[0]?.averageRating || 0,
        topProducts
      },
      recentOrders,
      recentReviews
    }
  });
});

export const getSellerDashboard = catchAsync(async (req, res) => {
  const sellerProductIds = await Product.find({ seller: req.user._id, isActive: true }).distinct('_id');
  const revenueStatuses = ['paid', 'processing', 'shipped', 'delivered'];

  const [
    products,
    reviews,
    recentOrders,
    recentReviews,
    revenueStats,
    ratingStats,
    lowStockItems,
    topProducts
  ] = await Promise.all([
    Product.countDocuments({ seller: req.user._id, isActive: true }),
    Review.countDocuments({ product: { $in: sellerProductIds } }),
    Order.find({ 'items.product': { $in: sellerProductIds } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('user total status items createdAt shippingAddress'),
    Review.find({ product: { $in: sellerProductIds } })
      .populate('user', 'name avatar')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
    Order.aggregate([
      { $match: { status: { $in: revenueStatuses }, 'items.product': { $in: sellerProductIds } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: sellerProductIds } } },
      { $group: { _id: null, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
    ]),
    Review.aggregate([
      { $match: { product: { $in: sellerProductIds } } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]),
    Inventory.countDocuments({
      product: { $in: sellerProductIds },
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }),
    Product.find({ _id: { $in: sellerProductIds }, isActive: true })
      .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
      .limit(5)
      .select('name price ratingAverage ratingCount')
  ]);

  res.json({
    dashboard: {
      role: 'seller',
      stats: { products, reviews },
      analytics: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averageRating: ratingStats[0]?.averageRating || 0,
        lowStockItems,
        topProducts
      },
      recentOrders,
      recentReviews
    }
  });
});

export const getUserDashboard = catchAsync(async (req, res) => {
  const [orders, cart] = await Promise.all([
    Order.countDocuments({ user: req.user._id }),
    Cart.findOne({ user: req.user._id })
  ]);

  res.json({
    dashboard: {
      role: 'user',
      stats: {
        orders,
        cartItems: cart?.items?.length || 0
      }
    }
  });
});
