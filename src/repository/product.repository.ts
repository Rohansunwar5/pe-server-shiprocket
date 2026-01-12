// product.repository.ts
import productModel, { IProduct } from '../models/product.model';
import mongoose from 'mongoose';

export interface ICreateProductParams {
  name: string;
  productCode: string;
  description?: string;
  bulletPoints?: string[];
  tags?: string[];
  categoryId: string;
  subcategoryId?: string;
  baseImage: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  slug: string;
  totalStock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface IUpdateProductParams {
  _id: string;
  name?: string;
  productCode?: string;
  description?: string;
  bulletPoints?: string[];
  tags?: string[];
  categoryId?: string;
  subcategoryId?: string;
  baseImage?: string;
  images?: string[];
  price?: number;
  originalPrice?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
  slug?: string;
  totalStock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface IGetProductsParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  categoryId?: string;
  subcategoryId?: string;
  searchQuery?: string;
  isFeatured?: boolean;
}

export class ProductRepository {
  private _model = productModel;

  async createProduct(params: ICreateProductParams): Promise<IProduct> {
    return this._model.create({
      name: params.name,
      productCode: params.productCode,
      description: params.description || '',
      categoryId: new mongoose.Types.ObjectId(params.categoryId),
      subcategoryId: params.subcategoryId ? new mongoose.Types.ObjectId(params.subcategoryId) : undefined,
      baseImage: params.baseImage,
      images: params.images || [],
      price: params.price,
      originalPrice: params.originalPrice,
      priceRange: params.priceRange,
      slug: params.slug,
      totalStock: params.totalStock || 0,
      isActive: params.isActive !== undefined ? params.isActive : true,
      isFeatured: params.isFeatured || false,
    });
  }

  async getProductById(id: string): Promise<IProduct | null> {
    return this._model.findById(id);
  }

  async getProductByCode(productCode: string): Promise<IProduct | null> {
    return this._model.findOne({ productCode: productCode.toUpperCase() });
  }

  async getProductBySlug(slug: string): Promise<IProduct | null> {
    return this._model.findOne({ slug: slug.toLowerCase() });
  }

  async getProducts(params: IGetProductsParams) {
    const page = params.page || 1;
    const limit = params.limit || 100;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive;
    }

    if (params.categoryId) {
      filter.categoryId = new mongoose.Types.ObjectId(params.categoryId);
    }

    if (params.subcategoryId) {
      filter.subcategoryId = new mongoose.Types.ObjectId(params.subcategoryId);
    }

    if (params.isFeatured !== undefined) {
      filter.isFeatured = params.isFeatured;
    }

    if (params.searchQuery) {
      filter.$or = [
        { name: { $regex: params.searchQuery, $options: 'i' } },
        { productCode: { $regex: params.searchQuery, $options: 'i' } },
        { description: { $regex: params.searchQuery, $options: 'i' } },
      ];
    }

    const products = await this._model
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this._model.countDocuments(filter);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProduct(params: IUpdateProductParams): Promise<IProduct | null> {
    const { _id, ...updateData } = params;

    const updateObject: any = {};

    if (updateData.name) updateObject.name = updateData.name;
    if (updateData.productCode) updateObject.productCode = updateData.productCode;
    if (updateData.description !== undefined) updateObject.description = updateData.description;
    if (updateData.categoryId) updateObject.categoryId = new mongoose.Types.ObjectId(updateData.categoryId);
    if (updateData.subcategoryId) updateObject.subcategoryId = new mongoose.Types.ObjectId(updateData.subcategoryId);
    if (updateData.baseImage) updateObject.baseImage = updateData.baseImage;
    if (updateData.images) updateObject.images = updateData.images;
    if (updateData.price !== undefined) updateObject.price = updateData.price;
    if (updateData.originalPrice !== undefined) updateObject.originalPrice = updateData.originalPrice;
    if (updateData.priceRange) updateObject.priceRange = updateData.priceRange;
    if (updateData.slug) updateObject.slug = updateData.slug;
    if (updateData.totalStock !== undefined) updateObject.totalStock = updateData.totalStock;
    if (updateData.isActive !== undefined) updateObject.isActive = updateData.isActive;
    if (updateData.isFeatured !== undefined) updateObject.isFeatured = updateData.isFeatured;

    return this._model.findByIdAndUpdate(_id, updateObject, { new: true });
  }

  async deleteProduct(id: string): Promise<IProduct | null> {
    return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async getProductsByCategory(categoryId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const products = await this._model
      .find({
        categoryId: new mongoose.Types.ObjectId(categoryId),
        isActive: true,
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this._model.countDocuments({
      categoryId: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
    });

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Helper method to sync product metrics from variants
  async syncProductMetrics(productId: string, metrics: {
    totalStock: number;
    basePrice: number;
    priceRange?: { min: number; max: number };
  }): Promise<IProduct | null> {
    return this._model.findByIdAndUpdate(
      productId,
      {
        totalStock: metrics.totalStock,
        price: metrics.basePrice,
        ...(metrics.priceRange && { priceRange: metrics.priceRange }),
      },
      { new: true }
    );
  }
}