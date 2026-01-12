import { NextFunction, Request, Response } from 'express';
import subcategoryService from '../services/subcategory.service';

export const createSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name, categoryId, description, image, shiprocketCollectionId, hsn, isActive } = req.body;
  
  const response = await subcategoryService.createSubcategory({
    name,
    categoryId,
    description,
    image,
    shiprocketCollectionId,
    hsn,
    isActive,
  });

  next(response);
};

export const getSubcategoryById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  const response = await subcategoryService.getSubcategoryById(id);

  next(response);
};

export const getSubcategoriesByCategoryId = async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId } = req.params;
  const { page, limit } = req.query;

  const response = await subcategoryService.getSubcategoriesByCategoryId(
    categoryId,
    page ? parseInt(page as string) : 1,
    limit ? parseInt(limit as string) : 100
  );

  next(response);
};

export const getAllSubcategories = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, isActive } = req.query;

  const response = await subcategoryService.getAllSubcategories(
    page ? parseInt(page as string) : 1,
    limit ? parseInt(limit as string) : 100,
    isActive ? isActive === 'true' : undefined
  );

  next(response);
};

export const updateSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, categoryId, description, image, shiprocketCollectionId, hsn, isActive } = req.body;

  const response = await subcategoryService.updateSubcategory({
    _id: id,
    name,
    categoryId,
    description,
    image,
    shiprocketCollectionId,
    hsn,
    isActive,
  });

  next(response);
};

export const deleteSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const response = await subcategoryService.deleteSubcategory(id);

  next(response);
};