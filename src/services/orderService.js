import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

export const createOrder = async (user, { items, shippingAddress }) => {
  if (!items?.length) {
    throw new ApiError('Order must include at least one item.', 400);
  }

  if (
    !shippingAddress?.phone ||
    !shippingAddress?.line1 ||
    !shippingAddress?.city ||
    !shippingAddress?.postalCode ||
    !shippingAddress?.country
  ) {
    throw new ApiError('Phone number and shipping address are required.', 400);
  }

  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const orderItems = items.map((item) => {
    const product = products.find((current) => current._id.toString() === item.product);

    if (!product) {
      throw new ApiError('One or more products were not found.', 400);
    }

    return {
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url,
      price: product.price,
      quantity: Number(item.quantity)
    };
  });

  const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 100 ? 0 : 8;
  const order = await Order.create({
    user: user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee
  });

  return order;
};

export const listUserOrders = (userId) => {
  return Order.find({ user: userId }).sort({ createdAt: -1 });
};

const adminOrderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const sellerOrderStatuses = ['paid', 'processing', 'shipped', 'delivered'];

export const updateOrderStatus = async (orderId, status, user) => {
  const allowedStatuses = user?.role === 'seller' ? sellerOrderStatuses : adminOrderStatuses;

  if (!allowedStatuses.includes(status)) {
    throw new ApiError('This order status is not allowed for your account.', 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  if (user?.role === 'seller') {
    const orderProductIds = [...new Set(order.items.map((item) => item.product.toString()))];
    const sellerProductCount = await Product.countDocuments({
      _id: { $in: orderProductIds },
      seller: user._id
    });

    if (sellerProductCount !== orderProductIds.length) {
      throw new ApiError('You can only update orders that contain your products only.', 403);
    }
  }

  order.status = status;
  await order.save();

  return order;
};
