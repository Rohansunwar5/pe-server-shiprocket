import { CartRepository } from '../../repository/cart.repository';
import productService from '../product.service';


export default function buildMerge(_cartRepository: CartRepository ) {
return {
        async mergeGuestIntoUser(userId: string, sessionId: string) {
            const userCart = await _cartRepository.getCartByUserId(userId) || await _cartRepository.createCart(userId);
            const guestCart = await _cartRepository.getCartBySessionId(sessionId);
            if (!guestCart || !guestCart.items.length) return userCart;


            const map = new Map<string, any>();
            const key = (it: any) => `${it.product.toString()}_${it.color.colorName}_${it.size}`;


            // seed user cart
            for (const it of userCart.items) map.set(key(it), { ...it, quantity: it.quantity });


            // merge guest items validating stock
            for (const g of guestCart.items) {
            try {
            const product = await productService.getProductById(g.product.toString());
            if (!product || !product.isActive) continue;
            const color = product.colors.find((c:any) => c.colorName === g.color.colorName);
            if (!color) continue;
            const sizeStock = color.sizeStock.find((s:any) => s.size === g.size);
            if (!sizeStock) continue;


            const k = key(g);
            if (map.has(k)) {
            const existing = map.get(k);
            const newQty = Math.min(existing.quantity + g.quantity, sizeStock.stock);
            map.set(k, { ...existing, quantity: newQty });
            } else {
            map.set(k, { product: g.product.toString(), quantity: Math.min(g.quantity, sizeStock.stock), size: g.size, color: g.color, selectedImage: g.selectedImage });
            }
            } catch (err) { continue; }
            }


            const items = Array.from(map.values());
            const updated = await _cartRepository.replaceCartItems(userId, items);
            await _cartRepository.deleteGuestCart(sessionId);
            return updated;
        }
    };
}