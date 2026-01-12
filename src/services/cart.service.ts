import { CartRepository } from '../repository/cart.repository';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import productVariantModel from '../models/productVariant.model';
import mongoose from 'mongoose';
import { InternalServerError } from '../errors/internal-server.error';

class CartService {
  constructor(private readonly _cartRepository: CartRepository) {}

  async getCart(params: { userId?: string; sessionId?: string }) {
    const { userId, sessionId } = params;

    if (!userId && !sessionId) {
      throw new BadRequestError('User ID or Session ID is required');
    }

    let cart = userId
      ? await this._cartRepository.getCartByUserId(userId)
      : await this._cartRepository.getCartBySessionId(sessionId!);

    if (!cart) {
      cart = await this._cartRepository.createCart({
        userId,
        sessionId,
        items: [],
      });
    }

    return this.buildCartResponse(cart);
  }
/**
 * Shiprocket Checkout Invariant:
 * - All cart items MUST have shiprocketVariantId
 * - Checkout token generation will FAIL otherwise
 * - Variant sync is enforced at checkout time
 */

  async clearCart(params: { userId?: string; sessionId?: string }) {
    const { userId, sessionId } = params;

    const cart = userId
      ? await this._cartRepository.getCartByUserId(userId)
      : await this._cartRepository.getCartBySessionId(sessionId!);

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const clearedCart = await this._cartRepository.clearCart(cart._id);

    if (!clearedCart) {
      throw new InternalServerError('Failed to clear cart');
    }

    return clearedCart;
  }

  async addToCart(params: { userId?: string; sessionId?: string; variantId: string; quantity: number }) {
    const { userId, sessionId, variantId, quantity } = params;

    if (!userId && !sessionId) {
      throw new BadRequestError('User ID or Session ID is required');
    }

    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    const variant = await productVariantModel.findOne({
      _id: variantId,
      isActive: true,
    });

    if (!variant) {
      throw new NotFoundError('Product variant not found or inactive');
    }

    if (variant.stock < quantity) {
      throw new BadRequestError(`Insufficient stock. Available: ${variant.stock}`);
    }

    let cart = userId
      ? await this._cartRepository.getCartByUserId(userId)
      : await this._cartRepository.getCartBySessionId(sessionId!);

    if (!cart) {
      cart = await this._cartRepository.createCart({
        userId,
        sessionId,
        items: [
          {
            variantId: new mongoose.Types.ObjectId(variantId),
            shiprocketVariantId: variant.shiprocketVariantId,
            quantity,
            priceSnapshot: variant.price,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        i => i.variantId.toString() === variantId
      );

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;

        if (variant.stock < newQty) {
          throw new BadRequestError(
            `Insufficient stock. Available: ${variant.stock}`
          );
        }

        cart = await this._cartRepository.updateCartItemQuantity({
          cartId: cart._id,
          variantId,
          quantity: newQty,
        });
      } else {
        cart = await this._cartRepository.addItemToCart({
          cartId: cart._id,
          variantId,
          shiprocketVariantId: variant.shiprocketVariantId,
          quantity,
          priceSnapshot: variant.price,
        });
      }
    }

    return this.buildCartResponse(cart!);
  }

  async updateCartItem(params: { userId?: string; sessionId?: string; variantId: string; quantity: number }) {
    const { userId, sessionId, variantId, quantity } = params;

    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    const cart = userId
      ? await this._cartRepository.getCartByUserId(userId)
      : await this._cartRepository.getCartBySessionId(sessionId!);

    if (!cart) throw new NotFoundError('Cart not found');

    const variant = await productVariantModel.findOne({
      _id: variantId,
      isActive: true,
    });

    if (!variant) throw new NotFoundError('Variant not found');

    if (variant.stock < quantity) {
      throw new BadRequestError(`Insufficient stock. Available: ${variant.stock}`);
    }

    const updatedCart = await this._cartRepository.updateCartItemQuantity({
      cartId: cart._id,
      variantId,
      quantity,
    });

    return this.buildCartResponse(updatedCart!);
  }

  async removeCartItem(params: { userId?: string; sessionId?: string; variantId: string }) {
    const { userId, sessionId, variantId } = params;

    const cart = userId
      ? await this._cartRepository.getCartByUserId(userId)
      : await this._cartRepository.getCartBySessionId(sessionId!);

    if (!cart) throw new NotFoundError('Cart not found');

    const updatedCart = await this._cartRepository.removeCartItem({
      cartId: cart._id,
      variantId,
    });

    return this.buildCartResponse(updatedCart!);
  }

  async getCartForShiprocketCheckout(params: { userId?: string; sessionId?: string }) {
    const { userId, sessionId } = params;

    const cart = userId
      ? await this._cartRepository.getCartByUserId(userId)
      : await this._cartRepository.getCartBySessionId(sessionId!);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    for (const item of cart.items) {
      const variant = await productVariantModel.findById(item.variantId);

      if (!variant || !variant.isActive) {
        throw new BadRequestError('One or more items are unavailable');
      }

      if (!item.shiprocketVariantId) {
        throw new BadRequestError(
          'Some items are not synced with Shiprocket'
        );
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for SKU ${variant.sku}`
        );
      }
    }

    return {
      cartId: cart._id,
      cartData: {
        items: cart.items.map(item => ({
          variant_id: item.shiprocketVariantId!, 
          quantity: item.quantity,
        })),
      },
    };
  }

  async mergeGuestCart(params: { sessionId: string; userId: string }) {
    const { sessionId, userId } = params;

    const guestCart = await this._cartRepository.getCartBySessionId(sessionId);
    if (!guestCart || guestCart.items.length === 0) return null;

    const userCart = await this._cartRepository.getCartByUserId(userId);

    if (!userCart) {
      return this._cartRepository.mergeGuestCartToUser({ sessionId, userId });
    }

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        i => i.variantId.toString() === guestItem.variantId.toString()
      );

      if (existing) {
        await this._cartRepository.updateCartItemQuantity({
          cartId: userCart._id,
          variantId: guestItem.variantId.toString(),
          quantity: existing.quantity + guestItem.quantity,
        });
      } else {
        await this._cartRepository.addItemToCart({
          cartId: userCart._id,
          variantId: guestItem.variantId.toString(),
          shiprocketVariantId: guestItem.shiprocketVariantId,
          quantity: guestItem.quantity,
          priceSnapshot: guestItem.priceSnapshot,
        });
      }
    }

    await this._cartRepository.deactivateCart(guestCart._id);
    return this.buildCartResponse(
      await this._cartRepository.getCartByUserId(userId)
    );
  }

  private async buildCartResponse(cart: any) {
    const variantIds = cart.items.map((i: any) => i.variantId);

    const variants = await productVariantModel.find({
      _id: { $in: variantIds },
    });

    const items = cart.items.map((item: any) => {
      const variant = variants.find(
        v => v._id.toString() === item.variantId.toString()
      );

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        variant: variant
          ? {
              sku: variant.sku,
              attributes: variant.attributes,
              image: variant.image,
              price: variant.price,
              stock: variant.stock,
              weight: variant.weight,
            }
          : null,
      };
    });

    const subtotal = items.reduce(
      (sum: number, i: any) => sum + i.priceSnapshot * i.quantity,
      0
    );

    return {
      _id: cart._id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items,
      summary: {
        subtotal,
        itemCount: items.length,
        totalQuantity: items.reduce(
          (sum: number, i: any) => sum + i.quantity,
          0
        ),
      },
      isActive: cart.isActive,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}

export default new CartService(new CartRepository());
