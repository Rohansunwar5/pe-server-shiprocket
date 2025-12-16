import { OrderRepository } from "../repository/order.repository";
import cartService from "./cart.service";
import shiprocketService from "./shiprocket.service";
import { nanoid } from "nanoid";

class OrderService {
  constructor(private readonly _orderRepo: OrderRepository) {}

  async createOrderFromCart(params: {
    userId?: string;
    sessionId?: string;
    shippingAddress: any;
    billingAddress?: any;
    paymentMethod: "prepaid" | "cod";
  }) {
    const cart = params.userId
      ? await cartService.getCart(params.userId)
      : await cartService.getGuestCart(params.sessionId!);

    if (!cart || !cart.items.length) {
      throw new Error("Cart is empty");
    }

    const totals = await cartService.calculateCartTotal(cart);

    const order = await this._orderRepo.createOrder({
      orderNumber: `ORD-${Date.now()}-${nanoid(6)}`,
      userId: params.userId,
      sessionId: params.sessionId,
      isGuestOrder: !params.userId,

      items: cart.items.map((i: any) => ({
        productId: i.product,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        selectedImage: i.selectedImage,
        hsn: i.hsn,
      })),

      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      shippingAmount: 0,
      totalAmount: totals.total,

      shippingAddress: params.shippingAddress,
      billingAddress: params.billingAddress || params.shippingAddress,

      payment: {
        provider: "shiprocket",
        status: "pending",
        method: params.paymentMethod === "cod" ? "cod" : undefined,
      },

      status: "payment_pending",
    });

    return order;
  }

  async initiateShiprocketCheckout(order: any) {
    const checkoutPayload = {
      order_id: order.orderNumber,
      amount: order.totalAmount,
      customer: order.shippingAddress,
    };

    const response = await shiprocketService.createCheckout(checkoutPayload);

    return response.data;
  }

  async handlePaymentSuccess(orderId: string, paymentPayload: any) {
    const order = await this._orderRepo.updatePayment(orderId, {
      ...paymentPayload,
      status: "paid",
      paidAt: new Date(),
    });

    await this._orderRepo.updateStatus(orderId, "confirmed");

    return this.createShipment(order);
  }

  async handleShiprocketPaymentSuccess(payload: any) {
    const {
      order_id,
      transaction_id,
      amount,
      payment_method,
      raw_response,
    } = payload;

    const order = await this._orderRepo.getOrderByOrderNumber(order_id);
    if (!order) throw new Error("Order not found");

    // Idempotency check
    if ((order as any).payment?.status === "paid") return;

    await this._orderRepo.updatePayment(order._id, {
      provider: "shiprocket",
      status: "paid",
      transactionId: transaction_id,
      method: payment_method,
      amount,
      paidAt: new Date(),
      raw: raw_response,
    });

    await this._orderRepo.updateStatus(order._id, "confirmed");

    // AUTO CREATE SHIPMENT
    await this.createShipment(order);
  }

  // ===============================
  // PAYMENT FAILURE
  // ===============================
  async handleShiprocketPaymentFailure(payload: any) {
    const { order_id, transaction_id, raw_response } = payload;

    const order = await this._orderRepo.getOrderByOrderNumber(order_id);
    if (!order) return;

    await this._orderRepo.updatePayment(order._id, {
      provider: "shiprocket",
      status: "failed",
      transactionId: transaction_id,
      raw: raw_response,
    });

    await this._orderRepo.updateStatus(order._id, "payment_pending");
  }

  // ===============================
  // SHIPMENT UPDATES
  // ===============================
  async handleShipmentUpdate(payload: any) {
    const {
      order_id,
      shipment_id,
      awb,
      courier_name,
      status,
      tracking_url,
      estimated_delivery,
      raw_response,
    } = payload;

    const order = await this._orderRepo.getOrderByOrderNumber(order_id);
    if (!order) return;

    await this._orderRepo.updateShipment(order._id, {
      shipmentId: shipment_id,
      awb,
      courierName: courier_name,
      status,
      trackingUrl: tracking_url,
      estimatedDelivery: estimated_delivery,
      raw: raw_response,
    });

    // Sync order status
    if (status === "delivered") {
      await this._orderRepo.updateStatus(order._id, "delivered");
    }
    if (status === "cancelled" || status === "rto_initiated") {
      await this._orderRepo.updateStatus(order._id, "cancelled");
    }
  }

  // ===============================
  // SHIPMENT CREATION
  // ===============================
  async createShipment(order: any) {
    if (order.shipment?.shipmentId) return; // idempotent

    const payload = {
      order_id: order.orderNumber,
      billing_customer_name: order.shippingAddress.name,
      billing_phone: order.shippingAddress.phone,
      billing_address: order.shippingAddress.addressLine1,
      billing_city: order.shippingAddress.city,
      billing_state: order.shippingAddress.state,
      billing_pincode: order.shippingAddress.pincode,

      order_items: order.items.map((i: any) => ({
        name: i.name,
        sku: i.productId.toString(),
        units: i.quantity,
        selling_price: i.price,
      })),
    };

    const res = await shiprocketService.createShipment(payload);

    await this._orderRepo.updateShipment(order._id, {
      shipmentId: res.data.shipment_id,
      awb: res.data.awb_code,
      courierName: res.data.courier_name,
      status: "pickup_scheduled",
      raw: res.data,
    });
  }

  async getOrderById(orderId: string) {
    return this._orderRepo.getOrderById(orderId);
  }

  async getOrdersByUser(userId: string) {
    return this._orderRepo.getOrdersByUser(userId);
  }
}

export default new OrderService(new OrderRepository());