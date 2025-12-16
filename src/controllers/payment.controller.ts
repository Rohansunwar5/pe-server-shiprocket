import { Request, Response, NextFunction } from "express";
import paymentService from "../services/payment.service";
import { IPaymentMethod, IPaymentStatus } from "../models/payment.model";
import { BadRequestError } from "../errors/bad-request.error";

// FIXED: Support both authenticated and guest users
export const initiatePayment = async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, method, notes, guestEmail } = req.body;
  const user = req.user?._id;
  // console.log(user);
  
  
  if (!user && !guestEmail) {
    throw new BadRequestError('Either authentication or guest email is required');
  }
  
  const response = await paymentService.initiatePayment({ 
    orderId, 
    method: method as IPaymentMethod, 
    notes, 
    user,
    guestEmail
  });
  
  next(response);
};

export const handleSuccessfulPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log('Payment success request:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature ? 'present' : 'missing'
    });

    const result = await paymentService.handleSuccessfulPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Payment processing failed'
    });
  }
};

export const handleFailedPayment = async (req: Request, res: Response, next: NextFunction) => {
  const { razorpayOrderId, razorpayPaymentId  } = req.body;
  const response = await paymentService.handleFailedPayment(
    razorpayOrderId, 
    razorpayPaymentId, 
  );
  
  next(response);
};

// FIXED: Support both authenticated and guest users
export const getPaymentDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { paymentId } = req.params;
  const user = req.user?._id;
  const { email } = req.query; // Guest email from query
  
  if (!user && !email) {
    throw new BadRequestError('Either authentication or email is required');
  }
  
  const response = await paymentService.getPaymentDetails(
    paymentId, 
    user, 
    email as string | undefined
  );
  
  next(response);
};

// FIXED: Support both authenticated and guest users
export const getPaymentByOrderId = async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const user = req.user?._id;
  const { email } = req.query;
  
  if (!user && !email) {
    throw new BadRequestError('Either authentication or email is required');
  }
  
  const response = await paymentService.getPaymentByOrderId(
    orderId, 
    user, 
    email as string | undefined
  );
  
  next(response);
};

// FIXED: Support both authenticated and guest users
export const getPaymentByOrderNumber = async (req: Request, res: Response, next: NextFunction) => {
  const { orderNumber } = req.params;
  const user = req.user?._id;
  const { email } = req.query;
  
  if (!user && !email) {
    throw new BadRequestError('Either authentication or email is required');
  }
  
  const response = await paymentService.getPaymentByOrderNumber(
    orderNumber, 
    user, 
    email as string | undefined
  );
  
  next(response);
};

export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const response = await paymentService.getPaymentHistory(user, Number(page), Number(limit));
  
  next(response);
};

// NEW: Get guest payment history
export const getGuestPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.query;
  
  if (!email) {
    throw new BadRequestError('Email is required for guest payment history');
  }
  
  const { page = 1, limit = 10 } = req.query;
  const response = await paymentService.getGuestPaymentHistory(
    email as string, 
    Number(page), 
    Number(limit)
  );
  
  next(response);
};

export const initiateRefund = async (req: Request, res: Response, next: NextFunction) => {
  const { paymentId, amount, reason } = req.body;
  
  const response = await paymentService.initiateRefund({
    paymentId,
    amount,
    reason
  });
  
  next(response);
};

export const processRefund = async (req: Request, res: Response, next: NextFunction) => {
  const { paymentId, refundId, status, razorpayRefundId } = req.body;
  
  const response = await paymentService.processRefund({
    paymentId,
    refundId,
    status,
    razorpayRefundId
  });
  
  next(response);
};

export const getPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, guestEmail } = req.query;
  const response = await paymentService.getPaymentStats(
    userId as string | undefined,
    guestEmail as string | undefined
  );
  
  next(response);
};

export const getPaymentsByMethod = async (req: Request, res: Response, next: NextFunction) => {
  const { method } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const response = await paymentService.getPaymentsByMethod(
    method as IPaymentMethod, 
    Number(page), 
    Number(limit)
  );
  
  next(response);
};

export const getPaymentsByStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const response = await paymentService.getPaymentsByStatus(
    status as IPaymentStatus, 
    Number(page), 
    Number(limit)
  );
  
  next(response);
};

export const getPaymentsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;
  const { page = 1, limit = 10 } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }
  
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format'
    });
  }
  
  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'Start date must be before end date'
    });
  }
  
  const response = await paymentService.getPaymentsByDateRange(
    start, 
    end, 
    Number(page), 
    Number(limit)
  );
  
  next(response);
};

export const getPaymentMethodStats = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, guestEmail } = req.query;
  const response = await paymentService.getPaymentMethodStats(
    userId as string | undefined,
    guestEmail as string | undefined
  );
  
  next(response);
};

export const getRefundStats = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, guestEmail } = req.query;
  const response = await paymentService.getRefundStats(
    userId as string | undefined,
    guestEmail as string | undefined
  );
  
  next(response);
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters'
      });
    }

    const result = await paymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
};