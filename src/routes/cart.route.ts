import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartForCheckout,
  mergeGuestCart,
} from '../controllers/cart.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { addToCartValidator, updateCartValidator } from '../middlewares/validators/cart.validators';
import { optionalAuth } from '../middlewares/optionalAuth.middleware';

const cartRouter = Router();

// Get cart (works for both authenticated and guest users)
cartRouter.get('/', optionalAuth, asyncHandler(getCart));

// Add item to cart
cartRouter.post(
  '/add',
  optionalAuth,
  addToCartValidator,
  asyncHandler(addToCart)
);

// Update cart item quantity
cartRouter.patch(
  '/update',
  optionalAuth,
  updateCartValidator,
  asyncHandler(updateCartItem)
);

// Remove item from cart
cartRouter.delete(
  '/remove/:variantId',
  optionalAuth,
  asyncHandler(removeCartItem)
);

// Clear entire cart
cartRouter.delete('/clear', optionalAuth, asyncHandler(clearCart));

// Get cart data formatted for Shiprocket Checkout
cartRouter.get(
  '/checkout-data',
  optionalAuth,
  asyncHandler(getCartForCheckout)
);

// Merge guest cart to user cart after login (authenticated only)
cartRouter.post('/merge', isLoggedIn, asyncHandler(mergeGuestCart));

export default cartRouter;