import { NextFunction, Request, Response } from 'express';
import cartService from '../services/cart.service';

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;

  const response = await cartService.getCart({ userId, sessionId });

  next(response);
};

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;
  const { variantId, quantity } = req.body;

  const response = await cartService.addToCart({
    userId,
    sessionId,
    variantId,
    quantity,
  });

  next(response);
};

export const updateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;
  const { variantId, quantity } = req.body;

  const response = await cartService.updateCartItem({
    userId,
    sessionId,
    variantId,
    quantity,
  });

  next(response);
};

export const removeCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;
  const { variantId } = req.params;

  const response = await cartService.removeCartItem({
    userId,
    sessionId,
    variantId,
  });

  next(response);
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;

  const response = await cartService.clearCart({ userId, sessionId });

  next(response);
};

export const getCartForCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;

  const response = await cartService.getCartForShiprocketCheckout({
    userId,
    sessionId,
  });

  next(response);
};

export const mergeGuestCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user._id;
  const { sessionId } = req.body;

  const response = await cartService.mergeGuestCart({ sessionId, userId });

  next(response);
};