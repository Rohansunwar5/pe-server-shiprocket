// productVariant.model.ts
import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
    },

    variantCode: {
      type: String,
      required: true,
      unique: true,
    },

    shiprocketVariantId: {
      type: String,
      index: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    attributes: {
      size: String,
      colorName: String,
      colorHex: String,
    },

    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    useBasePrice: {
      type: Boolean,
      default: false,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    weight: {
      type: Number, // in Kgs
      required: true,
    },

    hsn: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // For showing default variant on product page
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Display order
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1, isActive: 1 });
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ productId: 1, isDefault: 1 });

export interface IProductVariant {
  _id: string;
  productId: mongoose.Types.ObjectId;
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
  useBasePrice: boolean;
  stock: number;
  weight: number;
  hsn?: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default mongoose.model<IProductVariant>("ProductVariant", productVariantSchema);