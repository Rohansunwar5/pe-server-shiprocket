import config from "../config";
import { BadRequestError } from "../errors/bad-request.error";
import { InternalServerError } from "../errors/internal-server.error";
import { NotFoundError } from "../errors/not-found.error";
import { IOrderStatus } from "../models/order.model";
import { IPaymentMethod, IPaymentStatus } from "../models/payment.model";

import { OrderRepository } from "../repository/order.repository";
import { PaymentRepository } from "../repository/payment.repository";
import { UserRepository } from "../repository/user.repository";

import mailService from "./mail.service";
import orderService from "./order.service";
import productService from "./product.service";
import razorpayService from "./razorpay.service";
import shiprocketService from "./shiprocket.service";

export interface InitiatePaymentParams {
  orderId: string;
  user?: string; 
  guestEmail?: string;
  method: IPaymentMethod;
  notes?: any;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount: number;
  reason?: string;
  razorpayRefundId?: string;
}

export interface ProcessRefundParams {
  paymentId: string;
  refundId: string;
  status: "pending" | "processed" | "failed";
  razorpayRefundId?: string;
}

class PaymentService {
  constructor(
    private readonly _paymentRepository: PaymentRepository,
    private readonly _userRepository: UserRepository,
    private readonly _orderRepository: OrderRepository
  ) {}

  // ---------------------------------------------------------------------
  // INITIATE PAYMENT
  // ---------------------------------------------------------------------
  async initiatePayment(params: InitiatePaymentParams) {
    const { orderId, user, guestEmail, method, notes } = params;

    const order = await orderService.getOrderById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    if (user && (!order.user || order.user.toString() !== user)) {
      throw new BadRequestError("Order does not belong to user");
    }
    if (guestEmail && order.guestInfo?.email !== guestEmail) {
      throw new BadRequestError("Order does not belong to this email");
    }

    const existingPayment = await this._paymentRepository.getPaymentByOrderId(orderId);
    if (existingPayment) {
      throw new BadRequestError("Payment already initiated");
    }

    // -------------------------
    // COD ORDER
    // -------------------------
    if (method === IPaymentMethod.COD) {
      const payment = await this._paymentRepository.createPayment({
        orderId,
        orderNumber: order.orderNumber,
        user: order.user?.toString(),
        guestInfo: order.guestInfo,
        amount: order.total,
        currency: "INR",
        method: IPaymentMethod.COD,
        notes,
      });

      await this._paymentRepository.markPaymentAsCaptured(payment._id.toString());

      await this._orderRepository.updateOrder(orderId, {
        paymentStatus: IPaymentStatus.CAPTURED,
      });

      await orderService.updateOrderStatus(orderId, IOrderStatus.PROCESSING);

      return { payment };
    }

    // -------------------------
    // ONLINE PAYMENT (RAZORPAY)
    // -------------------------
    const amountInPaise = Math.round(order.total * 100);

    const razorpayOrder = await razorpayService.createOrder(
      orderId,
      amountInPaise,
      "INR",
      {
        ...notes,
        orderId,
        userId: user || order.user?.toString(),
        guestEmail: guestEmail || order.guestInfo?.email,
        orderNumber: order.orderNumber,
      }
    );

    const payment = await this._paymentRepository.createPayment({
      orderId,
      orderNumber: order.orderNumber,
      user: order.user?.toString(),
      guestInfo: order.guestInfo,
      amount: order.total,
      currency: "INR",
      method: IPaymentMethod.RAZORPAY,
      receipt: razorpayOrder.receipt,
      notes: { ...notes, razorpayOrder },
    });

    await this._paymentRepository.updatePayment(payment._id.toString(), {
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      payment,
      order: razorpayOrder,
      key: config.RAZORPAY_KEY_ID,
    };
  }

  // ---------------------------------------------------------------------
  // PAYMENT SUCCESS HANDLER
  // ---------------------------------------------------------------------
  // ---------------------------------------------------------------------
// PAYMENT SUCCESS HANDLER (EMAIL IS NOW NON-BLOCKING)
// ---------------------------------------------------------------------
async handleSuccessfulPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const payment = await this._paymentRepository.getPaymentByRazorpayOrderId(
    razorpayOrderId
  );
  if (!payment) throw new NotFoundError("Payment not found");

  const isValidSignature = await razorpayService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  if (!isValidSignature) throw new BadRequestError("Invalid payment signature");

  const razorpayPayment = await razorpayService.fetchPayment(razorpayPaymentId);
  if (razorpayPayment.status !== "captured") {
    throw new BadRequestError(`Payment not captured. Status: ${razorpayPayment.status}`);
  }

  await this._paymentRepository.markPaymentAsCaptured(
    payment._id.toString(),
    razorpayPaymentId,
    { razorpayPayment }
  );

  await this._orderRepository.updateOrder(payment.orderId.toString(), {
    paymentStatus: IPaymentStatus.CAPTURED,
  });

  const orderDetails = await this._orderRepository.getOrderById(
    payment.orderId.toString()
  );
  if (!orderDetails) throw new InternalServerError("Order not found");

  let userEmail = null;

  if (orderDetails.user) {
    const u = await this._userRepository.getUserById(orderDetails.user.toString());
    userEmail = u?.email;
  } else {
    userEmail = orderDetails.guestInfo?.email;
  }

  if (!userEmail) throw new InternalServerError("No customer email found");

  if (orderDetails.status === IOrderStatus.PENDING) {
    await orderService.updateOrderStatus(
      payment.orderId.toString(),
      IOrderStatus.PROCESSING
    );
  }

  console.log("🚀 Processing successful payment for order:", orderDetails.orderNumber);
  console.log("📦 Creating Shiprocket shipment…");

  // --------------------------------------------------------------------
  // SHIPROCKET (Blocking + Critical)
  // --------------------------------------------------------------------
  try {
    const shiprocketResponse = await shiprocketService.createShipment(
      orderDetails,
      userEmail
    );

    await this._orderRepository.updateOrder(orderDetails._id, {
      shipmentId: shiprocketResponse.shipment_id?.toString(),
      awbNumber: shiprocketResponse.awb_code,
      courierName: shiprocketResponse.courier_name,
      trackingUrl: `https://shiprocket.co/tracking/${shiprocketResponse.awb_code}`,
    });

    console.log("✅ Shiprocket shipment created:", shiprocketResponse);
  } catch (err: any) {
    console.error("❌ Shiprocket failed:", err.message);
    await this._orderRepository.updateOrder(orderDetails._id, {
      notes: `Shiprocket failed: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------
  // SEND EMAIL (NON-BLOCKING, DOES NOT INTERRUPT ANYTHING)
  // --------------------------------------------------------------------
  mailService
    .sendEmail(
      userEmail,
      "order-confirmation-email.ejs",
      {
        firstName: orderDetails.guestInfo?.firstName,
        lastName: orderDetails.guestInfo?.lastName,
        email: userEmail,
        orderNumber: orderDetails.orderNumber,
        orderDate: new Date(orderDetails.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        items: orderDetails.items,
        pricing: {
          subtotal: orderDetails.subtotal,
          totalDiscountAmount: orderDetails.totalDiscountAmount || 0,
          shippingCharge: orderDetails.shippingCharge,
          taxAmount: orderDetails.taxAmount,
          total: orderDetails.total,
        },
      },
      `Order Confirmation - ${orderDetails.orderNumber}`
    )
    .then(() => console.log("📧 Email sent successfully"))
    .catch((err) => {
      console.error("❌ Email sending failed (non-blocking):", err.message);
    });

  // Return immediately — email continues in background
  return payment;
}


  // ---------------------------------------------------------------------
  // FAILED PAYMENT
  // ---------------------------------------------------------------------
  async handleFailedPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string
  ) {
    const payment = await this._paymentRepository.getPaymentByRazorpayOrderId(
      razorpayOrderId
    );
    if (!payment) throw new NotFoundError("Payment not found");

    await this._paymentRepository.markPaymentAsFailed(payment._id.toString());

    await this._orderRepository.updateOrder(payment.orderId.toString(), {
      status: IOrderStatus.FAILED,
    });

    await orderService.updateOrderStatus(
      payment.orderId.toString(),
      IOrderStatus.FAILED
    );

    return true;
  }

  // ---------------------------------------------------------------------
  // VERIFY PAYMENT API
  // ---------------------------------------------------------------------
  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    return this.handleSuccessfulPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
  }

  // ---------------------------------------------------------------------
  // GET PAYMENT DETAILS
  // ---------------------------------------------------------------------
  async getPaymentDetails(paymentId: string, userId?: string, guestEmail?: string) {
    const payment = await this._paymentRepository.getPaymentById(paymentId);
    if (!payment) throw new NotFoundError("Payment not found");

    if (userId && payment.user?.toString() !== userId) {
      throw new BadRequestError("Unauthorized payment access");
    }
    if (guestEmail && payment.guestInfo?.email !== guestEmail) {
      throw new BadRequestError("Unauthorized payment access");
    }

    return payment;
  }

  // ---------------------------------------------------------------------
  // GET PAYMENT BY ORDER ID
  // ---------------------------------------------------------------------
  async getPaymentByOrderId(orderId: string, userId?: string, guestEmail?: string) {
    const payment = await this._paymentRepository.getPaymentByOrderId(orderId);
    if (!payment) throw new NotFoundError("Payment not found");

    if (userId && payment.user?.toString() !== userId) {
      throw new BadRequestError("Unauthorized access");
    }
    if (guestEmail && payment.guestInfo?.email !== guestEmail) {
      throw new BadRequestError("Unauthorized access");
    }

    return payment;
  }

  // ---------------------------------------------------------------------
  // GET PAYMENT BY ORDER NUMBER
  // ---------------------------------------------------------------------
  async getPaymentByOrderNumber(orderNumber: string, userId?: string, guestEmail?: string) {
    const payment = await this._paymentRepository.getPaymentByOrderNumber(orderNumber);
    if (!payment) throw new NotFoundError("Payment not found");

    if (userId && payment.user?.toString() !== userId) {
      throw new BadRequestError("Unauthorized access");
    }
    if (guestEmail && payment.guestInfo?.email !== guestEmail) {
      throw new BadRequestError("Unauthorized access");
    }

    return payment;
  }

  // ---------------------------------------------------------------------
  // PAYMENT HISTORY (USER)
  // ---------------------------------------------------------------------
  async getPaymentHistory(userId: string, page: number, limit: number) {
    return this._paymentRepository.getPaymentsByUser(userId, page, limit);
  }

  // ---------------------------------------------------------------------
  // PAYMENT HISTORY (GUEST)
  // ---------------------------------------------------------------------
  async getGuestPaymentHistory(email: string, page: number, limit: number) {
    return this._paymentRepository.getPaymentsByGuestEmail(email, page, limit);
  }

  // ---------------------------------------------------------------------
  // INITIATE REFUND
  // ---------------------------------------------------------------------
  async initiateRefund(params: RefundPaymentParams) {
    const payment = await this._paymentRepository.getPaymentById(params.paymentId);
    if (!payment) throw new NotFoundError("Payment not found");

    return this._paymentRepository.addRefund({
      paymentId: params.paymentId,
      amount: params.amount,
      reason: params.reason,
      razorpayRefundId: params.razorpayRefundId,
    });
  }

  // ---------------------------------------------------------------------
  // PROCESS REFUND
  // ---------------------------------------------------------------------
  async processRefund(params: ProcessRefundParams) {
    return this._paymentRepository.updateRefundStatus({
      paymentId: params.paymentId,
      refundId: params.refundId,
      status: params.status,
      processedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------
  // PAYMENT STATISTICS
  // ---------------------------------------------------------------------
  async getPaymentStats(userId?: string, guestEmail?: string) {
    return this._paymentRepository.getPaymentStats(userId, guestEmail);
  }

  async getPaymentsByMethod(method: IPaymentMethod, page: number, limit: number) {
    return this._paymentRepository.getPaymentsByMethod(method, page, limit);
  }

  async getPaymentsByStatus(status: IPaymentStatus, page: number, limit: number) {
    return this._paymentRepository.getPaymentsByStatus(status, page, limit);
  }

  async getPaymentsByDateRange(start: Date, end: Date, page: number, limit: number) {
    return this._paymentRepository.getPaymentsByDateRange(start, end, page, limit);
  }

  async getPaymentMethodStats(userId?: string, guestEmail?: string) {
    return this._paymentRepository.getPaymentsByMethodStats(userId, guestEmail);
  }

  async getRefundStats(userId?: string, guestEmail?: string) {
    return this._paymentRepository.getRefundStats(userId, guestEmail);
  }
}

export default new PaymentService(
  new PaymentRepository(),
  new UserRepository(),
  new OrderRepository()
);
