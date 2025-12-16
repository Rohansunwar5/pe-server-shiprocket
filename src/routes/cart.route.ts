import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';

import {getCart,getCartWithDetails,addItemToCart,updateCartItemByProduct,removeCartItemByProduct,applyDiscount,removeDiscount,validateDiscountForUser,clearCartItems,deleteCart,validateCart,mergeGuestCartOnLogin, getGuestCart,getGuestCartWithDetails,addItemToGuestCart,updateGuestCartItemByProduct,removeGuestCartItemByProduct,applyGuestDiscount,removeGuestDiscount } from '../controllers/cart.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const cartRouter = Router();

cartRouter.get('/', isLoggedIn, asyncHandler(getCart));
cartRouter.get('/details', isLoggedIn, asyncHandler(getCartWithDetails));
cartRouter.post('/', isLoggedIn, asyncHandler(addItemToCart));
cartRouter.put('/item/:itemId', isLoggedIn, asyncHandler(updateCartItemByProduct));
cartRouter.delete('/item/:itemId', isLoggedIn, asyncHandler(removeCartItemByProduct));
cartRouter.post('/apply-discount', isLoggedIn, asyncHandler(applyDiscount));
cartRouter.delete('/remove-discount', isLoggedIn, asyncHandler(removeDiscount));
cartRouter.post('/validate-discount', isLoggedIn, asyncHandler(validateDiscountForUser));
cartRouter.delete('/clear', isLoggedIn, asyncHandler(clearCartItems));
cartRouter.delete('/', isLoggedIn, asyncHandler(deleteCart));
cartRouter.post('/validate', isLoggedIn, asyncHandler(validateCart));

//guest routes

cartRouter.get('/guest/:sessionId', asyncHandler(getGuestCart));
cartRouter.get('/guest/:sessionId/details', asyncHandler(getGuestCartWithDetails));
cartRouter.post('/guest/:sessionId', asyncHandler(addItemToGuestCart));
cartRouter.put('/guest/:sessionId/item/:itemId',asyncHandler(updateGuestCartItemByProduct));
cartRouter.delete('/guest/:sessionId/item/:itemId',asyncHandler(removeGuestCartItemByProduct));
cartRouter.post('/guest/:sessionId/apply-discount',asyncHandler(applyGuestDiscount));
cartRouter.delete('/guest/:sessionId/remove-discount',asyncHandler(removeGuestDiscount));
cartRouter.post('/guest/validate', asyncHandler(validateCart));
cartRouter.post('/merge', isLoggedIn, asyncHandler(mergeGuestCartOnLogin));

export default cartRouter;