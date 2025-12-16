import { Request, Response } from "express";
import orderService from "../services/order.service";

export const shiprocketWebhook = async (req: Request, res: Response) => {
  try {
    const secret = req.headers["x-shiprocket-secret"];

    if (secret !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
      console.warn("Invalid Shiprocket webhook secret");
      return res.status(401).json({ success: false });
    }

    const payload = req.body;
    const event = payload.event_type;

    switch (event) {
      case "payment_success":
        await orderService.handleShiprocketPaymentSuccess(payload);
        break;

      case "payment_failed":
        await orderService.handleShiprocketPaymentFailure(payload);
        break;

      case "shipment_created":
      case "awb_assigned":
      case "pickup_scheduled":
      case "in_transit":
      case "delivered":
      case "rto_initiated":
      case "cancelled":
        await orderService.handleShipmentUpdate(payload);
        break;

      default:
        console.warn("Unhandled Shiprocket webhook:", event);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Shiprocket webhook error:", err.message);

    return res.status(200).json({ success: false });
  }
};