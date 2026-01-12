import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  createCategory,
  getCategoryById,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import isAdminLoggedIn from '../middlewares/isAdminLoggedIn.middleware';

const categoryRouter = Router();

categoryRouter.get( '/', asyncHandler(getCategories));
categoryRouter.get( '/:id', asyncHandler(getCategoryById));
categoryRouter.post( '/create', isAdminLoggedIn, asyncHandler(createCategory));
categoryRouter.patch( '/:id', isAdminLoggedIn, asyncHandler(updateCategory));
categoryRouter.delete( '/:id', isAdminLoggedIn, asyncHandler(deleteCategory));

export default categoryRouter;