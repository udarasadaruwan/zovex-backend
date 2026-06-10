import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import stripe from '../config/stripe.js';
import ApiError from '../utils/ApiError.js';
import { sendOrderConfirmationEmail } from './emailService.js';

export const createCheckoutSession = async (orderId, user) => {
  if (!stripe) {
    throw new ApiError('Stripe sandbox key is missing. Add STRIPE_SECRET_KEY to backend/.env.', 400);
  }

  const order = await Order.findOne({ _id: orderId, user: user._id });

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  if (order.status !== 'pending') {
    throw new ApiError('This order is no longer awaiting payment.', 400);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100)
    },
    quantity: item.quantity
  }));

  if (order.deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery fee' },
        unit_amount: Math.round(order.deliveryFee * 100)
      },
      quantity: 1
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: lineItems,
    success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/checkout/cancelled`,
    metadata: {
      orderId: order._id.toString(),
      userId: user._id.toString()
    }
  });

  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    amount: order.total,
    stripeSessionId: session.id,
    status: 'pending'
  });

  order.payment = payment._id;
  await order.save();

  return session;
};

export const completeCheckoutSession = async (sessionId, user) => {
  if (!stripe) {
    throw new ApiError('Stripe sandbox key is missing. Add STRIPE_SECRET_KEY to backend/.env.', 400);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new ApiError('Payment has not been completed yet.', 400);
  }

  const payment = await Payment.findOne({
    stripeSessionId: sessionId,
    user: user._id
  });

  if (!payment) {
    throw new ApiError('Payment record not found.', 404);
  }

  const order = await Order.findOne({
    _id: payment.order,
    user: user._id
  });

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  if (
    session.metadata?.orderId !== order._id.toString() ||
    session.metadata?.userId !== user._id.toString()
  ) {
    throw new ApiError('Payment session does not match this order.', 400);
  }

  const wasAlreadyPaid = payment.status === 'paid';

  if (!wasAlreadyPaid) {
    payment.status = 'paid';
    await payment.save();
  }

  if (order.status === 'pending') {
    order.status = 'paid';
    await order.save();
  }

  await Cart.findOneAndUpdate({ user: user._id }, { items: [] });

  if (!wasAlreadyPaid) {
    sendOrderConfirmationEmail(user, order).catch((error) => {
      console.warn('Order confirmation email failed:', error.message);
    });
  }

  return order;
};
