import { NextFunction, Request, Response } from 'express';
import productService from '../services/product.service';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    productCode,
    description,
    bulletPoints,
    tags,
    categoryId,
    subcategoryId,
    baseImage,
    images,
    price,
    originalPrice,
    slug,
    isActive,
    isFeatured,
  } = req.body;

  const response = await productService.createProduct({
    name,
    productCode,
    description,
    bulletPoints,
    tags,
    categoryId,
    subcategoryId,
    baseImage,
    images,
    price,
    originalPrice,
    slug,
    isActive,
    isFeatured,
  });

  next(response);
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const response = await productService.getProductById(id);
  next(response);
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, isActive, categoryId, subcategoryId, searchQuery } = req.query;

  const response = await productService.getProducts({
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 100,
    isActive: isActive ? isActive === 'true' : undefined,
    categoryId: categoryId as string,
    subcategoryId: subcategoryId as string,
    searchQuery: searchQuery as string,
  });

  next(response);
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const {
    name,
    productCode,
    description,
    bulletPoints,
    tags,
    categoryId,
    subcategoryId,
    baseImage,
    images,
    price,
    originalPrice,
    slug,
    isActive,
    isFeatured,
  } = req.body;

  const response = await productService.updateProduct({
    _id: id,
    name,
    productCode,
    bulletPoints,
    tags,
    description,
    categoryId,
    subcategoryId,
    baseImage,
    images,
    price,
    originalPrice,
    slug,
    isActive,
    isFeatured,
  });

  next(response);
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const response = await productService.deleteProduct(id);
  next(response);
};

export const getProductWithVariants = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const response = await productService.getProductWithVariants(id);
  next(response);
};

export const getProductsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId } = req.params;
  const { page, limit } = req.query;

  const response = await productService.getProductsByCategory(
    categoryId,
    page ? parseInt(page as string) : 1,
    limit ? parseInt(limit as string) : 100
  );

  next(response);
};
