import discountService from '../discount.service';
import { CartRepository } from '../../repository/cart.repository';
import productService from '../product.service';

export default function buildCartDiscounts(_cartRepository: CartRepository) {
  return {
    async applyDiscountToUser(
      userId: string,
      code: string,
      type: 'coupon' | 'voucher'
    ) {
      const cart = await _cartRepository.getCartByUserId(userId);
      if (!cart || !cart.items.length) {
        throw new Error('Cart is empty');
      }

      const productIds = cart.items.map(i => i.product.toString());

      const quantities = cart.items.reduce((acc: any, it: any) => {
        const pid = it.product.toString();
        acc[pid] = (acc[pid] || 0) + it.quantity;
        return acc;
      }, {});

      // ✅ FETCH PRODUCTS FOR PRICE (NO SNAPSHOTS)
      const products = await Promise.all(
        productIds.map(id => productService.getProductById(id))
      );

      const productMap = products.reduce((acc: any, p: any) => {
        if (p) acc[p._id.toString()] = p;
        return acc;
      }, {});

      const subtotal = cart.items.reduce((sum: number, it: any) => {
        const product = productMap[it.product.toString()];
        if (!product) return sum;
        return sum + product.price * it.quantity;
      }, 0);

      const result = await discountService.applyDiscount({
        code,
        productIds,
        quantities,
        subtotal
      });

      return _cartRepository.applyDiscount(userId, type, result);
    },

    async applyDiscountToGuest(
      sessionId: string,
      code: string,
      type: 'coupon' | 'voucher'
    ) {
      const cart = await _cartRepository.getCartBySessionId(sessionId);
      if (!cart || !cart.items.length) {
        throw new Error('Cart is empty');
      }

      const productIds = cart.items.map(i => i.product.toString());

      const quantities = cart.items.reduce((acc: any, it: any) => {
        const pid = it.product.toString();
        acc[pid] = (acc[pid] || 0) + it.quantity;
        return acc;
      }, {});

      // ✅ FETCH PRODUCTS FOR PRICE (NO SNAPSHOTS)
      const products = await Promise.all(
        productIds.map(id => productService.getProductById(id))
      );

      const productMap = products.reduce((acc: any, p: any) => {
        if (p) acc[p._id.toString()] = p;
        return acc;
      }, {});

      const subtotal = cart.items.reduce((sum: number, it: any) => {
        const product = productMap[it.product.toString()];
        if (!product) return sum;
        return sum + product.price * it.quantity;
      }, 0);

      const result = await discountService.applyDiscount({
        code,
        productIds,
        quantities,
        subtotal
      });

      return _cartRepository.applyDiscountBySessionId(sessionId, type, result);
    },

    async clearDiscount(
      userId: string,
      type: 'coupon' | 'voucher' | 'all'
    ) {
      return _cartRepository.removeDiscount(userId, type);
    },

    async clearGuestDiscount(
      sessionId: string,
      type: 'coupon' | 'voucher' | 'all'
    ) {
      return _cartRepository.clearGuestDiscount(sessionId, type);
    }
  };
}
