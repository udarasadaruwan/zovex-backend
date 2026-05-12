import { completeCheckoutSession, createCheckoutSession } from '../services/paymentService.js';
import catchAsync from '../utils/catchAsync.js';

export const checkoutSession = catchAsync(async (req, res) => {
  const session = await createCheckoutSession(req.body.orderId, req.user);
  res.json({ url: session.url, sessionId: session.id });
});

export const checkoutSuccess = catchAsync(async (req, res) => {
  const order = await completeCheckoutSession(req.params.sessionId, req.user);
  res.json({ order });
});
