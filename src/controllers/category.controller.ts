import { NextFunction, Request, Response } from 'express';
import categoryService from '../services/category.service';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, image, shiprocketCollectionId, hsn, isActive } = req.body;
  
  const response = await categoryService.createCategory({
    name,
    description,
    image,
    shiprocketCollectionId,
    hsn,
    isActive,
  });

  next(response);
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  const response = await categoryService.getCategoryById(id);

  next(response);
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, isActive, searchQuery } = req.query;

  const response = await categoryService.getCategories({
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 100,
    isActive: isActive ? isActive === 'true' : undefined,
    searchQuery: searchQuery as string,
  });

  next(response);
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, description, image, shiprocketCollectionId, hsn, isActive } = req.body;

  const response = await categoryService.updateCategory({
    _id: id,
    name,
    description,
    image,
    shiprocketCollectionId,
    hsn,
    isActive,
  });

  next(response);
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const response = await categoryService.deleteCategory(id);

  next(response);
};