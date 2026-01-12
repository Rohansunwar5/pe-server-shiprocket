import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  createSubcategory,
  getSubcategoryById,
  getSubcategoriesByCategoryId,
  getAllSubcategories,
  updateSubcategory,
  deleteSubcategory,
} from '../controllers/subcategory.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';

const subcategoryRouter = Router();

// Public routes
subcategoryRouter.get(
  '/',
  asyncHandler(getAllSubcategories)
);

subcategoryRouter.get(
  '/:id',
  asyncHandler(getSubcategoryById)
);

subcategoryRouter.get(
  '/category/:categoryId',
  asyncHandler(getSubcategoriesByCategoryId)
);

// Admin routes
subcategoryRouter.post(
  '/',
  isAdminLoggedIn,
  asyncHandler(createSubcategory)
);

subcategoryRouter.patch(
  '/:id',
  isAdminLoggedIn,
  asyncHandler(updateSubcategory)
);

subcategoryRouter.delete(
  '/:id',
  isAdminLoggedIn,
  asyncHandler(deleteSubcategory)
);

export default subcategoryRouter;