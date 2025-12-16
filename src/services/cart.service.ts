import { CartRepository } from "../repository/cart.repository";
import { OrderRepository } from "../repository/order.repository";
import buildCartDiscounts from "./cart/cart.discount";
import buildMerge from "./cart/cart.marge";
import buildCartOperations from "./cart/cart.opertaions";
import buildSummary from "./cart/cart.summary";



const cartRepo = new CartRepository();
const orderRepo = new OrderRepository();


const ops = buildCartOperations(cartRepo);
const discounts = buildCartDiscounts(cartRepo);
const merger = buildMerge(cartRepo);
const summary = buildSummary(cartRepo);


export default {
// basic retrieval
getCart: (userId:string) => cartRepo.getCartByUserId(userId),
getGuestCart: (sessionId: string) => cartRepo.getOrCreateGuestCart(sessionId),
getOrCreateCart: (userId:string) => cartRepo.createCart(userId),

// user operations
addItemToCart: (userId:string, item:any) => ops.addItemToUserCart(userId, item),
updateCartItem: (userId:string, itemId:string, data:any) => ops.updateUserCartItem(userId, itemId, data),
removeCartItem: (userId:string, itemId:string) => ops.removeUserCartItem(userId, itemId),

// guest operations
addItemToGuestCart: (sessionId:string, item:any) => ops.addItemToGuestCart(sessionId, item),
updateGuestCartItem: (sessionId:string, itemId:string, data:any) => ops.updateGuestCartItem(sessionId, itemId, data),
removeGuestCartItem: (sessionId:string, itemId:string) => ops.removeGuestCartItem(sessionId, itemId),


// discounts
applyDiscountToUser: (userId:string, code:string, type:'coupon'|'voucher') => discounts.applyDiscountToUser(userId, code, type),
applyDiscountToGuest: (sessionId:string, code:string, type:'coupon'|'voucher') => discounts.applyDiscountToGuest(sessionId, code, type),
clearDiscount: (userId:string, type:'coupon'|'voucher'|'all') => discounts.clearDiscount(userId, type),
clearGuestDiscount: (sessionId:string, type:'coupon'|'voucher'|'all') => discounts.clearGuestDiscount(sessionId, type),


// merge
mergeGuestIntoUser: (userId:string, sessionId:string) => merger.mergeGuestIntoUser(userId, sessionId),


// summary
calculateCartTotal: (cart:any) => summary.calculateCartTotal(cart),
buildCartDetails: (cart:any) => summary.buildCartDetails(cart),


// additional repository passes
transferGuestCartToUser: (sessionId:string, userId:string) => cartRepo.transferGuestCartToUser(sessionId, userId),
deleteCart: (userId:string) => cartRepo.deleteCart(userId),
clearCartItems: (userId:string) => cartRepo.clearCartItems(userId),
};