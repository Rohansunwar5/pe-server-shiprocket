// productVariant.repository.ts
import productVariantModel, { IProductVariant } from '../models/productVariant.model';
import mongoose from 'mongoose';

export interface ICreateVariantParams {
  productId: string;
  variantCode: string;
  shiprocketVariantId?: string;
  sku: string;
  attributes: {
    size?: string;
    colorName?: string;
    colorHex?: string;
  };
  image: string;
  price: number;
  originalPrice?: number;
  useBasePrice?: boolean;
  stock: number;
  weight: number;
  hsn?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface IUpdateVariantParams {
  _id: string;
  variantCode?: string;
  shiprocketVariantId?: string;
  sku?: string;
  attributes?: {
    size?: string;
    colorName?: string;
    colorHex?: string;
  };
  image?: string;
  price?: number;
  originalPrice?: number;
  useBasePrice?: boolean;
  stock?: number;
  weight?: number;
  hsn?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export class ProductVariantRepository {
  private _model = productVariantModel;

  async createVariant(params: ICreateVariantParams): Promise<IProductVariant> {
    return this._model.create({
      productId: new mongoose.Types.ObjectId(params.productId),
      variantCode: params.variantCode,
      shiprocketVariantId: params.shiprocketVariantId,
      sku: params.sku,
      attributes: params.attributes,
      image: params.image,
      price: params.price,
      originalPrice: params.originalPrice,
      useBasePrice: params.useBasePrice || false,
      stock: params.stock,
      weight: params.weight,
      hsn: params.hsn || '',
      isActive: params.isActive !== undefined ? params.isActive : true,
      isDefault: params.isDefault || false,
      sortOrder: params.sortOrder || 0,
    });
  }

  async getVariantById(id: string): Promise<IProductVariant | null> {
    return this._model.findById(id);
  }

  async getVariantBySku(sku: string): Promise<IProductVariant | null> {
    return this._model.findOne({ sku });
  }

  async getVariantByCode(variantCode: string): Promise<IProductVariant | null> {
    return this._model.findOne({ variantCode });
  }

  async getVariantsByProductId(productId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const variants = await this._model
      .find({
        productId: new mongoose.Types.ObjectId(productId),
      })
      .skip(skip)
      .limit(limit)
      .sort({ sortOrder: 1, createdAt: -1 });

    const total = await this._model.countDocuments({
      productId: new mongoose.Types.ObjectId(productId),
    });

    return {
      variants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllVariants(page = 1, limit = 100, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const variants = await this._model
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this._model.countDocuments(filter);

    return {
      variants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateVariant(params: IUpdateVariantParams): Promise<IProductVariant | null> {
    const { _id, ...updateData } = params;

    const updateObject: any = {};

    if (updateData.variantCode) updateObject.variantCode = updateData.variantCode;
    if (updateData.shiprocketVariantId) updateObject.shiprocketVariantId = updateData.shiprocketVariantId;
    if (updateData.sku) updateObject.sku = updateData.sku;
    if (updateData.attributes) updateObject.attributes = updateData.attributes;
    if (updateData.image) updateObject.image = updateData.image;
    if (updateData.price !== undefined) updateObject.price = updateData.price;
    if (updateData.originalPrice !== undefined) updateObject.originalPrice = updateData.originalPrice;
    if (updateData.useBasePrice !== undefined) updateObject.useBasePrice = updateData.useBasePrice;
    if (updateData.stock !== undefined) updateObject.stock = updateData.stock;
    if (updateData.weight !== undefined) updateObject.weight = updateData.weight;
    if (updateData.hsn !== undefined) updateObject.hsn = updateData.hsn;
    if (updateData.isActive !== undefined) updateObject.isActive = updateData.isActive;
    if (updateData.isDefault !== undefined) updateObject.isDefault = updateData.isDefault;
    if (updateData.sortOrder !== undefined) updateObject.sortOrder = updateData.sortOrder;

    return this._model.findByIdAndUpdate(_id, updateObject, { new: true });
  }

  async updateStock(variantId: string, quantity: number): Promise<IProductVariant | null> {
    return this._model.findByIdAndUpdate(variantId, { $inc: { stock: quantity } }, { new: true });
  }

  async deleteVariant(id: string): Promise<IProductVariant | null> {
    return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async getVariantsByIds(variantIds: string[]): Promise<IProductVariant[]> {
    const objectIds = variantIds.map(id => new mongoose.Types.ObjectId(id));
    return this._model.find({ _id: { $in: objectIds } });
  }

  async getDefaultVariant(productId: string): Promise<IProductVariant | null> {
    return this._model.findOne({
      productId: new mongoose.Types.ObjectId(productId),
      isDefault: true,
      isActive: true,
    });
  }

  async clearDefaultVariants(productId: string): Promise<void> {
    await this._model.updateMany(
      { productId: new mongoose.Types.ObjectId(productId) },
      { isDefault: false }
    );
  }
}