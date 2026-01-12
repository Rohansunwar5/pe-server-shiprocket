import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  fetchProducts,
  fetchProductsByCollection,
  fetchCollections,
  getProductWebhookData,
} from '../controllers/shiprocketCatalog.controller';
// import { shiprocketAuthMiddleware } from '../middlewares/shiprocketAuth.middleware';

const shiprocketCatalogRouter = Router();

// These endpoints will be called BY Shiprocket
// You should add shiprocketAuthMiddleware to verify HMAC signature
// For now, they're open - add your authentication middleware

// Catalog Sync APIs - Called by Shiprocket
shiprocketCatalogRouter.get(
  '/products',
  // shiprocketAuthMiddleware,
  asyncHandler(fetchProducts)
);

shiprocketCatalogRouter.get(
  '/products-by-collection',
  // shiprocketAuthMiddleware,
  asyncHandler(fetchProductsByCollection)
);

shiprocketCatalogRouter.get(
  '/collections',
  // shiprocketAuthMiddleware,
  asyncHandler(fetchCollections)
);

// Internal endpoint to get formatted webhook data
shiprocketCatalogRouter.get(
  '/webhook-data/:productId',
  asyncHandler(getProductWebhookData)
);

export default shiprocketCatalogRouter;