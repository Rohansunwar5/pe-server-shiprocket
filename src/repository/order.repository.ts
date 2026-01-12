import orderModel, { IOrder } from '../models/order.model';
import mongoose from 'mongoose';

export interface ICreateOrderParams {
  userId?: string;
  sessionId?: string;
  shiprocketOrderId: string;
  orderNumber: string;
  items: Array<{
    variantId: mongoose.Types.ObjectId;
    shiprocketVariantId?: string;
    productName: string;
    sku: string;
    attributes: {
      size?: string;
      colorName?: string;
      colorHex?: string;
    };
    image?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: {
    name?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
  };
  paymentType: string;
  paymentStatus: string;
  pricing: {
    subtotal: number;
    discount: number;
    shippingCharges: number;
    tax: number;
    total: number;
  };
  appliedCoupon?: {
    code: string;
    discountAmount: number;
  };
  appliedVoucher?: {
    code: string;
    discountAmount: number;
  };
}

export class OrderRepository {
  private _model = orderModel;

  async createOrder(params: ICreateOrderParams): Promise<IOrder> {
    return this._model.create(params);
  }

  async getOrderById(orderId: string): Promise<IOrder | null> {
    return this._model.findById(orderId);
  }

  async getOrderByShiprocketId(
    shiprocketOrderId: string
  ): Promise<IOrder | null> {
    return this._model.findOne({ shiprocketOrderId });
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    return this._model.findOne({ orderNumber });
  }

  async getOrdersByUserId(userId: string): Promise<IOrder[]> {
    return this._model.find({ userId }).sort({ createdAt: -1 });
  }

  async updateOrderStatus(params: {
    orderId: string;
    orderStatus: string;
  }): Promise<IOrder | null> {
    const { orderId, orderStatus } = params;

    const updateData: any = { orderStatus };

    if (orderStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    return this._model.findByIdAndUpdate(orderId, updateData, { new: true });
  }

  async updatePaymentStatus(params: {
    orderId: string;
    paymentStatus: string;
  }): Promise<IOrder | null> {
    const { orderId, paymentStatus } = params;

    return this._model.findByIdAndUpdate(
      orderId,
      { paymentStatus },
      { new: true }
    );
  }

  async updateTrackingInfo(params: {
    orderId: string;
    trackingNumber: string;
    shiprocketShipmentId?: string;
  }): Promise<IOrder | null> {
    const { orderId, trackingNumber, shiprocketShipmentId } = params;

    return this._model.findByIdAndUpdate(
      orderId,
      {
        trackingNumber,
        ...(shiprocketShipmentId && { shiprocketShipmentId }),
      },
      { new: true }
    );
  }

  async cancelOrder(params: {
    orderId: string;
    cancellationReason: string;
  }): Promise<IOrder | null> {
    const { orderId, cancellationReason } = params;

    return this._model.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'CANCELLED',
        cancellationReason,
        cancelledAt: new Date(),
      },
      { new: true }
    );
  }

  async addOrderNotes(params: {
    orderId: string;
    notes: string;
  }): Promise<IOrder | null> {
    const { orderId, notes } = params;

    return this._model.findByIdAndUpdate(orderId, { notes }, { new: true });
  }

  async getOrdersWithFilters(params: {
    userId?: string;
    orderStatus?: string;
    paymentStatus?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ orders: IOrder[]; total: number }> {
    const {
      userId,
      orderStatus,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = params;

    const query: any = {};

    if (userId) query.userId = userId;
    if (orderStatus) query.orderStatus = orderStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this._model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this._model.countDocuments(query),
    ]);

    return { orders, total };
  }
}