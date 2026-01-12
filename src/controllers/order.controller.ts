import { NextFunction, Request, Response } from 'express';
import orderService from '../services/order.service';

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { orderId } = req.params;

  const response = await orderService.getOrderById(orderId);

  next(response);
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user._id;
  const { page, limit, orderStatus, paymentStatus } = req.query;

  const response = await orderService.getUserOrders({
    userId,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    orderStatus: orderStatus as string,
    paymentStatus: paymentStatus as string,
  });

  next(response);
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  const response = await orderService.updateOrderStatus({
    orderId,
    orderStatus,
  });

  next(response);
};

export const updateTrackingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { orderId } = req.params;
  const { trackingNumber, shiprocketShipmentId } = req.body;

  const response = await orderService.updateTrackingInfo({
    orderId,
    trackingNumber,
    shiprocketShipmentId,
  });

  next(response);
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { orderId } = req.params;
  const { cancellationReason } = req.body;

  const response = await orderService.cancelOrder({
    orderId,
    cancellationReason,
  });

  next(response);
};