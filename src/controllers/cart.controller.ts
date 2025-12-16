import { NextFunction, Request, Response } from 'express';
import cartService from '../services/cart.service';
import { CartItemInput, UpdateCartItemInput } from '../repository/cart.repository';
import discountService from '../services/discount.service';
import { BadRequestError } from '../errors/bad-request.error';

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;

  const response = await cartService.getCart(userId);
  next(response);
};

export const getCartWithDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;

  const cart = await cartService.getCart(userId);

  const response = await cartService.buildCartDetails(cart);
  next(response);
};

export const addItemToCart = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const itemData: CartItemInput = req.body;

  const response = await cartService.addItemToCart(userId, itemData);
  next(response);
};

export const updateCartItemByProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const { itemId } = req.params;
  const updateData: UpdateCartItemInput = req.body;

  const response = await cartService.updateCartItem(userId, itemId, updateData);
  next(response);
};

export const removeCartItemByProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const { itemId } = req.params;

  const response = await cartService.removeCartItem(userId, itemId);
  next(response);
};

// ====================================
// USER DISCOUNTS
// ====================================

export const applyDiscount = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const { code, type } = req.body;

  const response = await cartService.applyDiscountToUser(userId, code, type);
  next(response);
};

export const removeDiscount = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const { type } = req.body;

  const response = await cartService.clearDiscount(userId, type);
  next(response);
};

// ====================================
// GUEST CART
// ====================================

export const getGuestCart = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const cart = await cartService.getGuestCart(sessionId);

  next(cart);
};

export const getGuestCartWithDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const cart = await cartService.getGuestCart(sessionId);
  const details = await cartService.buildCartDetails(cart);

  next(details);
};

export const addItemToGuestCart = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const itemData: CartItemInput = req.body;

  const response = await cartService.addItemToGuestCart(sessionId, itemData);
  next(response);
};

export const updateGuestCartItemByProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId, itemId } = req.params;
  const updateData: UpdateCartItemInput = req.body;

  const response = await cartService.updateGuestCartItem(sessionId, itemId, updateData);
  next(response);
};

export const removeGuestCartItemByProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId, itemId } = req.params;

  const response = await cartService.removeGuestCartItem(sessionId, itemId);
  next(response);
};

// ====================================
// GUEST DISCOUNTS
// ====================================

export const applyGuestDiscount = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { code, type } = req.body;

  const response = await cartService.applyDiscountToGuest(sessionId, code, type);
  next(response);
};

export const removeGuestDiscount = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { type } = req.body;

  const response = await cartService.clearGuestDiscount(sessionId, type);
  next(response);
};

// ====================================
// MERGE GUEST → USER ON LOGIN
// ====================================

export const mergeGuestCartOnLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const { sessionId } = req.body;

  const response = await cartService.mergeGuestIntoUser(userId, sessionId);
  next(response);
};

// ====================================
// VALIDATE CART ITEMS
// ====================================

export const validateCart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { sessionId } = req.query;

  if (!userId && !sessionId) {
    throw new BadRequestError('Either userId or sessionId is required');
  }

  const cart = userId
    ? await cartService.getCart(userId)
    : await cartService.getGuestCart(sessionId!.toString());

  const details = await cartService.buildCartDetails(cart);

  next({
    success: true,
    data: details,
  });
};




export const validateDiscountForUser = async (req: Request, res: Response, next: NextFunction) => {
  const { _id: userId } = req.user;
  const { code } = req.body;

  const hasUsed = await discountService.hasUserUsedDiscount(code, userId);

  next({
    success: true,
    data: {
      canUse: !hasUsed,
      message: hasUsed ? "You have already used this discount code" : "Discount is available"
    }
  });
};

export const clearCartItems = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const cart = await cartService.clearCartItems(userId);

  next(cart);
};

export const deleteCart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const response = await cartService.deleteCart(userId);

  next(response);
};
