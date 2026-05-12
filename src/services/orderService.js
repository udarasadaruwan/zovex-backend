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

export const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  return order;
};
