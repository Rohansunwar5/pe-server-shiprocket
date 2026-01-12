import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { createProduct, deleteProduct, getProductById, getProducts, getProductsByCategory, getProductWithVariants, updateProduct, uploadAssets } from '../controllers/product.controllers';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';
import { uploadImage } from '../middlewares/multer.middleware';
import { optionalAuth } from '../middlewares/optionalAuth.middleware';
import { generateCheckoutToken } from '../controllers/shipment.controller';

const productRouter = Router();


productRouter.post('/', isAdminLoggedIn, asyncHandler(createProduct));
productRouter.get('/',asyncHandler(getProducts));
productRouter.get('/:id',asyncHandler(getProductById));
productRouter.get('/:id/variants', asyncHandler(getProductWithVariants));
productRouter.get( '/category/:categoryId', asyncHandler(getProductsByCategory));
productRouter.patch('/:id', isAdminLoggedIn, asyncHandler(updateProduct ));
productRouter.delete( '/:id', isAdminLoggedIn, asyncHandler(deleteProduct));
productRouter.post( "/upload/assets", isAdminLoggedIn, uploadImage, asyncHandler(uploadAssets));
productRouter.post( "/checkout/token", optionalAuth, asyncHandler(generateCheckoutToken));

export default productRouter;