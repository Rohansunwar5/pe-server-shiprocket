import cartModel, { ICart } from '../models/cart.model';
import mongoose from 'mongoose';

export interface IAddToCartParams {
  userId?: string;
  sessionId?: string;
  variantId: string;
  shiprocketVariantId?: string;
  quantity: number;
  priceSnapshot: number;
}

export interface IUpdateCartItemParams {
  cartId: string;
  variantId: string;
  quantity: number;
}

export interface IRemoveCartItemParams {
  cartId: string;
  variantId: string;
}

export class CartRepository {
  private _model = cartModel;

  async getCartByUserId(userId: string): Promise<ICart | null> {
    return this._model.findOne({ userId, isActive: true });
  }

  async getCartBySessionId(sessionId: string): Promise<ICart | null> {
    return this._model.findOne({ sessionId, isActive: true });
  }

  async getCartById(cartId: string): Promise<ICart | null> {
    return this._model.findById(cartId);
  }

  async createCart(params: {
    userId?: string;
    sessionId?: string;
    items: Array<{
      variantId: mongoose.Types.ObjectId;
      shiprocketVariantId?: string;
      quantity: number;
      priceSnapshot: number;
    }>;
  }): Promise<ICart> {
    return this._model.create({
      userId: params.userId,
      sessionId: params.sessionId,
      items: params.items,
      isActive: true,
    });
  }

  async addItemToCart(params: {
    cartId: string;
    variantId: string;
    shiprocketVariantId?: string;
    quantity: number;
    priceSnapshot: number;
  }): Promise<ICart | null> {
    const { cartId, variantId, shiprocketVariantId, quantity, priceSnapshot } = params;

    return this._model.findByIdAndUpdate(
      cartId,
      {
        $push: {
          items: {
            variantId: new mongoose.Types.ObjectId(variantId),
            shiprocketVariantId,
            quantity,
            priceSnapshot,
          },
        },
      },
      { new: true }
    );
  }

  async updateCartItemQuantity(params: {
    cartId: string;
    variantId: string;
    quantity: number;
  }): Promise<ICart | null> {
    const { cartId, variantId, quantity } = params;

    return this._model.findOneAndUpdate(
      {
        _id: cartId,
        'items.variantId': new mongoose.Types.ObjectId(variantId),
      },
      {
        $set: {
          'items.$.quantity': quantity,
        },
      },
      { new: true }
    );
  }

  async removeCartItem(params: {
    cartId: string;
    variantId: string;
  }): Promise<ICart | null> {
    const { cartId, variantId } = params;

    return this._model.findByIdAndUpdate(
      cartId,
      {
        $pull: {
          items: { variantId: new mongoose.Types.ObjectId(variantId) },
        },
      },
      { new: true }
    );
  }

  async clearCart(cartId: string): Promise<ICart | null> {
    return this._model.findByIdAndUpdate(
      cartId,
      {
        $set: { items: [] },
      },
      { new: true }
    );
  }

  async applyCoupon(params: {
    cartId: string;
    code: string;
    discountAmount: number;
  }): Promise<ICart | null> {
    const { cartId, code, discountAmount } = params;

    return this._model.findByIdAndUpdate(
      cartId,
      {
        $set: {
          appliedCoupon: { code, discountAmount },
        },
      },
      { new: true }
    );
  }

  async removeCoupon(cartId: string): Promise<ICart | null> {
    return this._model.findByIdAndUpdate(
      cartId,
      {
        $unset: { appliedCoupon: '' },
      },
      { new: true }
    );
  }

  async applyVoucher(params: {
    cartId: string;
    code: string;
    discountAmount: number;
  }): Promise<ICart | null> {
    const { cartId, code, discountAmount } = params;

    return this._model.findByIdAndUpdate(
      cartId,
      {
        $set: {
          appliedVoucher: { code, discountAmount },
        },
      },
      { new: true }
    );
  }

  async removeVoucher(cartId: string): Promise<ICart | null> {
    return this._model.findByIdAndUpdate(
      cartId,
      {
        $unset: { appliedVoucher: '' },
      },
      { new: true }
    );
  }

  async deactivateCart(cartId: string): Promise<ICart | null> {
    return this._model.findByIdAndUpdate(
      cartId,
      {
        $set: { isActive: false },
      },
      { new: true }
    );
  }

  async mergeGuestCartToUser(params: {
    sessionId: string;
    userId: string;
  }): Promise<ICart | null> {
    const { sessionId, userId } = params;

    return this._model.findOneAndUpdate(
      { sessionId, isActive: true },
      {
        $set: { userId, sessionId: undefined },
      },
      { new: true }
    );
  }
}