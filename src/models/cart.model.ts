// cart.model.ts
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
    },

    shiprocketVariantId: {
      type: String,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceSnapshot: {
      type: Number, 
      required: true,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
    },

    sessionId: {
      type: String,
      index: true,
    },

    items: [cartItemSchema],

    appliedCoupon: {
      code: String,
      discountAmount: Number,
    },

    appliedVoucher: {
      code: String,
      discountAmount: Number,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index(
  { userId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true }, isActive: true } }
);

cartSchema.index(
  { sessionId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { sessionId: { $exists: true }, isActive: true } }
);


export interface ICart {
  _id: string;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: {
    variantId: mongoose.Types.ObjectId;
    shiprocketVariantId?: string;
    quantity: number;
    priceSnapshot: number;
  }[];
  isActive: boolean;
}

export default mongoose.model<ICart>("Cart", cartSchema);