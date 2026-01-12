import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  createVariant,
  getVariantById,
  getVariantsByProductId,
  getAllVariants,
  updateVariant,
  updateStock,
  deleteVariant,
} from '../controllers/productVariant.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';
// import { createVariantValidator, updateVariantValidator } from '../middlewares/validators/productVariant.validator';

const productVariantRouter = Router();

// Admin routes - Create, Update, Delete variants
productVariantRouter.post('/', isAdminLoggedIn, asyncHandler(createVariant));
productVariantRouter.get( '/', asyncHandler(getAllVariants));
productVariantRouter.get( '/:id', asyncHandler(getVariantById));
productVariantRouter.get( '/product/:productId', asyncHandler(getVariantsByProductId));
productVariantRouter.patch( '/:id', isAdminLoggedIn, asyncHandler(updateVariant));
productVariantRouter.patch('/:id/stock',isAdminLoggedIn, asyncHandler(updateStock));
productVariantRouter.delete('/:id', isAdminLoggedIn, asyncHandler(deleteVariant));

export default productVariantRouter;