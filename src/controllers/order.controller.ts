import { Request, Response, NextFunction } from "express";
import orderService from "../services/order.service";

/**
 * Create Order (Guest or User)
 */
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { sessionId, paymentMethod, shippingAddress } = req.body;

  const order = await orderService.createOrderFromCart({
    userId,
    sessionId,
    paymentMethod,
    shippingAddress
  });

  next({
    success: true,
    data: order
  });
};

/**
 * Get Order by ID
 */
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId);
  next({ success: true, data: order });
};

/**
 * Get My Orders (logged-in)
 */
export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user._id;

  const orders = await orderService.getOrdersByUser(userId);
  next({ success: true, data: orders });
};
