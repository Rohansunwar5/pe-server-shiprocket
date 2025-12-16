import orderModel from "../models/order.model";

export class OrderRepository {
  private _model = orderModel;

  createOrder(data: any) {
    return this._model.create(data);
  }

  getOrderById(id: string) {
    return this._model.findById(id);
  }

  getOrderByOrderNumber(orderNumber: string) {
    return this._model.findOne({ orderNumber });
  }

  getOrdersByUser(userId: string) {
    return this._model.find({ userId }).sort({ createdAt: -1 });
  }

  getOrdersBySession(sessionId: string) {
    return this._model.find({ sessionId }).sort({ createdAt: -1 });
  }

  updateOrder(id: string, update: any) {
    return this._model.findByIdAndUpdate(id, update, { new: true });
  }

  updatePayment(orderId: string, payment: any) {
    return this._model.findByIdAndUpdate(
      orderId,
      { $set: { payment } },
      { new: true }
    );
  }

  updateShipment(orderId: string, shipment: any) {
    return this._model.findByIdAndUpdate(
      orderId,
      { $set: { shipment } },
      { new: true }
    );
  }

  updateStatus(orderId: string, status: string) {
    return this._model.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true }
    );
  }
}
