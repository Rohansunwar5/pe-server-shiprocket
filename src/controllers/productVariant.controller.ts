import { NextFunction, Request, Response } from 'express';
import productVariantService from '../services/productVariant.service';

export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
  const {
    productId,
    variantCode,
    shiprocketVariantId,
    sku,
    attributes,
    image,
    price,
    originalPrice,
    useBasePrice,
    stock,
    weight,
    hsn,
    isActive,
    isDefault,
    sortOrder,
  } = req.body;

  const response = await productVariantService.createVariant({
    productId,
    variantCode,
    shiprocketVariantId,
    sku,
    attributes,
    image,
    price,
    originalPrice,
    useBasePrice,
    stock,
    weight,
    hsn,
    isActive,
    isDefault,
    sortOrder,
  });

  next(response);
};

export const getVariantById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const response = await productVariantService.getVariantById(id);
  next(response);
};

export const getVariantsByProductId = async (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  const { page, limit } = req.query;

  const response = await productVariantService.getVariantsByProductId(
    productId,
    page ? parseInt(page as string) : 1,
    limit ? parseInt(limit as string) : 100
  );

  next(response);
};

export const getAllVariants = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, isActive } = req.query;

  const response = await productVariantService.getAllVariants(
    page ? parseInt(page as string) : 1,
    limit ? parseInt(limit as string) : 100,
    isActive ? isActive === 'true' : undefined
  );

  next(response);
};

export const updateVariant = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const {
    variantCode,
    shiprocketVariantId,
    sku,
    attributes,
    image,
    price,
    originalPrice,
    useBasePrice,
    stock,
    weight,
    hsn,
    isActive,
    isDefault,
    sortOrder,
  } = req.body;

  const response = await productVariantService.updateVariant({
    _id: id,
    variantCode,
    shiprocketVariantId,
    sku,
    attributes,
    image,
    price,
    originalPrice,
    useBasePrice,
    stock,
    weight,
    hsn,
    isActive,
    isDefault,
    sortOrder,
  });

  next(response);
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const response = await productVariantService.updateStock(id, quantity);
  next(response);
};

export const deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const response = await productVariantService.deleteVariant(id);
  next(response);
};