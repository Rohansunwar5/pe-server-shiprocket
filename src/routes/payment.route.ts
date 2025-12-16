import { Router } from "express";
import isLoggedIn from "../middlewares/isLoggedIn.middleware";
import { asyncHandler } from "../utils/asynchandler";
import {
  initiatePayment,
  handleSuccessfulPayment,
  handleFailedPayment,
  getPaymentDetails,
  getPaymentByOrderId,
  getPaymentByOrderNumber,
  getPaymentHistory,
  getGuestPaymentHistory,
  initiateRefund,
  processRefund,
  getPaymentStats,
  getPaymentsByMethod,
  getPaymentsByStatus,
  getPaymentsByDateRange,
  getPaymentMethodStats,
  getRefundStats,
  verifyPayment
} from "../controllers/payment.controller";
import isAdminLoggedIn from "../middlewares/isAdminLoggedIn.middleware";
import razorpayService from "../services/razorpay.service";
import isLoggedInOptional from "../middlewares/isLoggedInOptional.middleware";

const paymentRouter = Router();

// FIXED: Payment initiation - support both auth and guest
// For guest: send guestEmail in body
// For auth: uses req.user from middleware
paymentRouter.post('/initiate', isLoggedInOptional,asyncHandler(initiatePayment));

// Payment processing - no auth required (webhook-like)
paymentRouter.post('/success', asyncHandler(handleSuccessfulPayment));
paymentRouter.post('/failure', asyncHandler(handleFailedPayment));
paymentRouter.post('/verify', asyncHandler(verifyPayment));

// FIXED: Payment details - support both auth and guest
// For guest: add ?email=guest@example.com to query
// For auth: uses req.user from middleware
paymentRouter.get('/details/:paymentId', asyncHandler(getPaymentDetails));
paymentRouter.get('/order/:orderId', asyncHandler(getPaymentByOrderId));
paymentRouter.get('/order-number/:orderNumber', asyncHandler(getPaymentByOrderNumber));

// Payment history - authenticated users only
paymentRouter.get('/history', isLoggedIn, asyncHandler(getPaymentHistory));

// NEW: Guest payment history
paymentRouter.get('/guest/history', asyncHandler(getGuestPaymentHistory)); // ?email=...

// Refund management (Admin only)
paymentRouter.post('/refund/initiate', isAdminLoggedIn, asyncHandler(initiateRefund));
paymentRouter.put('/refund/process', isAdminLoggedIn, asyncHandler(processRefund));

// Analytics and reporting (Admin only)
paymentRouter.get('/stats', isAdminLoggedIn, asyncHandler(getPaymentStats));
paymentRouter.get('/stats/methods', isAdminLoggedIn, asyncHandler(getPaymentMethodStats));
paymentRouter.get('/stats/refunds', isAdminLoggedIn, asyncHandler(getRefundStats));

// Payment filtering (Admin only)
paymentRouter.get('/method/:method', isAdminLoggedIn, asyncHandler(getPaymentsByMethod));
paymentRouter.get('/status/:status', isAdminLoggedIn, asyncHandler(getPaymentsByStatus));
paymentRouter.get('/date-range', isAdminLoggedIn, asyncHandler(getPaymentsByDateRange));

// Webhook handling
paymentRouter.post('/webhook',
  asyncHandler(async (req, res) => {
    const eventId = req.headers['x-razorpay-event-id'];
    const event = req.headers['x-razorpay-event'] as string; 
    
    if (!eventId || !event) {
      return res.status(400).json({ 
        error: 'Missing required webhook headers' 
      });
    }

    try {
      await razorpayService.handleWebhook(event, req.body);
      res.json({ 
        status: 'ok',
        message: 'Webhook processed successfully' 
      });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ 
        error: 'Webhook processing failed',
        message: error.message 
      });
    }
  })
);

export default paymentRouter;