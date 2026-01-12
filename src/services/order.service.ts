import { OrderRepository } from '../repository/order.repository';
import { CartRepository } from '../repository/cart.repository';
import { NotFoundError } from '../errors/not-found.error';
import { BadRequestError } from '../errors/bad-request.error';
import productVariantModel from '../models/productVariant.model';
import productModel from '../models/product.model';
import mongoose from 'mongoose';
import mailService from './mail.service';

class OrderService {
  constructor( private readonly _orderRepository: OrderRepository, private readonly _cartRepository: CartRepository ) {}

  async createOrderFromWebhook(webhookData: any) {
    const {
      order_id,
      cart_data,
      status,
      phone,
      email,
      payment_type,
      total_amount_payable,
      shipping_address,
      discount_amount,
      coupon_code,
      voucher_code,
    } = webhookData;

    if (status !== 'SUCCESS') {
      throw new BadRequestError('Order status is not SUCCESS');
    }

    const existingOrder = await this._orderRepository.getOrderByShiprocketId(
      order_id
    );

    if (existingOrder) {
      return existingOrder;
    }

    const orderNumber = await this.generateOrderNumber();
    const orderItems = await Promise.all(
    cart_data.items.map(async (item: any) => {
      const variant = await productVariantModel.findOne({
        shiprocketVariantId: item.variant_id,
      });

      if (!variant) {
        throw new NotFoundError(
          `Variant not found for Shiprocket ID: ${item.variant_id}`
        );
      }

      const product = await productModel.findById(variant.productId);

      if (!product) {
        throw new NotFoundError(
          `Product not found for variant: ${variant._id}`
        );
      }

      return {
          variantId: variant._id,
          shiprocketVariantId: variant.shiprocketVariantId,
          productName: product.name, 
          sku: variant.sku,
          attributes: variant.attributes,
          image: variant.image,
          quantity: item.quantity,
          price: variant.price,
          subtotal: variant.price * item.quantity,
        };
      })
    );

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = discount_amount || 0;
    const total = total_amount_payable;

    const paymentTypeMap: any = {
      CASH_ON_DELIVERY: 'CASH_ON_DELIVERY',
      COD: 'CASH_ON_DELIVERY',
      PREPAID: 'PREPAID',
      UPI: 'UPI',
      CARD: 'CARD',
      WALLET: 'WALLET',
    };

    const order = await this._orderRepository.createOrder({
      shiprocketOrderId: order_id,
      orderNumber,
      items: orderItems,
      shippingAddress: {
        name: shipping_address?.name || '',
        phone: phone || '',
        email: email || '',
        addressLine1: shipping_address?.address_line1 || '',
        addressLine2: shipping_address?.address_line2 || '',
        city: shipping_address?.city || '',
        state: shipping_address?.state || '',
        pinCode: shipping_address?.pincode || '',
        country: shipping_address?.country || 'India',
      },
      paymentType: paymentTypeMap[payment_type] || 'CASH_ON_DELIVERY',
      paymentStatus: payment_type === 'PREPAID' ? 'PAID' : 'PENDING',
      pricing: {
        subtotal,
        discount,
        shippingCharges: 0,
        tax: 0,
        total,
      },
      ...(coupon_code && {
        appliedCoupon: {
          code: coupon_code,
          discountAmount: discount,
        },
      }),
      ...(voucher_code && {
        appliedVoucher: {
          code: voucher_code,
          discountAmount: discount,
        },
      }),
    });

    await this.updateStock(orderItems);

    // Clear cart if available
    // Note: You'll need to determine userId/sessionId from webhook data
    // For now, we'll skip cart clearing as webhook doesn't provide this info

    // Send order confirmation email
    if (email) {
      await this.sendOrderConfirmationEmail(order);
    }

    return order;
  }

  async getOrderById(orderId: string) {
    const order = await this._orderRepository.getOrderById(orderId);
    if (!order) throw new NotFoundError('Order not found')

    return order;
  }

  async getOrderByShiprocketId(shiprocketOrderId: string) {
    const order = await this._orderRepository.getOrderByShiprocketId(shiprocketOrderId);

    return order;
  }
  
  async getUserOrders(params: { userId: string; page?: number; limit?: number; orderStatus?: string; paymentStatus?: string }) {
    const { userId, page, limit, orderStatus, paymentStatus } = params;

    return this._orderRepository.getOrdersWithFilters({
      userId,
      orderStatus,
      paymentStatus,
      page,
      limit,
    });
  }

  async updateOrderStatus(params: { orderId: string; orderStatus: string }) {
    const order = await this._orderRepository.updateOrderStatus(params);

    if (!order) throw new NotFoundError('Order not found')

    return order;
  }

  async updatePaymentStatus(params: { orderId: string, paymentStatus: string}) {
    const order = await this._orderRepository.updatePaymentStatus(params);
    if (!order) throw new NotFoundError('Order not found')

    return order;
  }

  async updateTrackingInfo(params: { orderId: string; trackingNumber: string; shiprocketShipmentId?: string }) {
    const order = await this._orderRepository.updateTrackingInfo(params);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async cancelOrder(params: { orderId: string; cancellationReason: string }) {
    const order = await this._orderRepository.cancelOrder(params);

    if (!order)  throw new NotFoundError('Order not found');
    await this.restoreStock(order.items);

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  private async restoreStock(items: any[]) {
    //TODO: optimize with bulk operations
    for(const item of items) {
      await productVariantModel.findByIdAndUpdate(item.variantId, {
        $inc: { stock: item.quantity},
      })
    }
  }

  private async updateStock(items: any[]) {
    for (const item of items) {
      await productVariantModel.findByIdAndUpdate(item.variantId, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  private async sendOrderConfirmationEmail(order: any) {
    try {
      await mailService.sendEmail(
        order.shippingAddress.email,
        'order-confirmation.ejs',
        {
          orderNumber: order.orderNumber,
          customerName: order.shippingAddress.name,
          items: order.items,
          subtotal: order.pricing.subtotal,
          discount: order.pricing.discount,
          total: order.pricing.total,
          shippingAddress: order.shippingAddress,
          paymentType: order.paymentType,
        },
        `Order Confirmation - ${order.orderNumber}`
      );
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
    }
  }
}

export default new OrderService( new OrderRepository(), new CartRepository());