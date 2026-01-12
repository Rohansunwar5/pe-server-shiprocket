import crypto from 'crypto';
import config from '../config';
import axios from 'axios';
import shiprocketCatalogService from './shiprocketCatalog.service';
import orderService from './order.service';
import cartService from './cart.service';

class ShiprocketWebhookService {
  private baseUrl = 'https://checkout-api.shiprocket.com';
  private apiKey = config.SHIPROCKET_API_KEY;
  private secretKey = config.SHIPROCKET_SECRET_KEY;

  private generateHMAC(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(dataString)
      .digest('base64');
  }

  async sendProductUpdateWebhook(productId: string) {
    try {
      const productData = await shiprocketCatalogService.formatProductUpdateWebhook(productId);

      const hmac = this.generateHMAC(productData);

      const response = await axios.post(
        `${this.baseUrl}/wh/v1/custom/product`,
        productData,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'X-Api-HMAC-SHA256': hmac,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error sending product update webhook to Shiprocket:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendCollectionUpdateWebhook(collectionId: string, collectionData: any) {
    try {
      const data = {
        id: collectionId,
        updated_at: new Date().toISOString(),
        title: collectionData.title,
        body_html: collectionData.body_html || '',
        image: {
          src: collectionData.image || '',
        },
      };

      const hmac = this.generateHMAC(data);

      const response = await axios.post(
        `${this.baseUrl}/wh/v1/custom/collection`,
        data,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'X-Api-HMAC-SHA256': hmac,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error sending collection update webhook to Shiprocket:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleOrderWebhook(rawBody: string, hmacHeader?: string) {
  // 1️⃣ Security first
    this.verifyIncomingHMAC(rawBody, hmacHeader);

    // 2️⃣ Parse AFTER verification
    const payload = JSON.parse(rawBody);

    const eventType = this.resolveEventType(payload);

    switch (eventType) {
      case 'ORDER_SUCCESS':
        return this.handleOrderSuccess(payload);

      case 'ORDER_FAILED':
        return this.handleOrderFailed(payload);

      case 'ORDER_CANCELLED':
        return this.handleOrderCancelled(payload);

      case 'ORDER_STATUS_UPDATE':
        return this.handleOrderStatusUpdate(payload);

      default:
        console.warn('[Shiprocket] Unknown event:', eventType);
        return { ignored: true };
    }
  }

  private async handleOrderSuccess(payload: any) {
    await cartService.clearCart({
      userId: payload.user_id,
      sessionId: payload.session_id,
    });
    return orderService.createOrderFromWebhook(payload);
  }

  private async handleOrderFailed(payload: any) {
    const order = await orderService.getOrderByShiprocketId(payload.order_id);
    if (!order) return;

    await orderService.updatePaymentStatus({
      orderId: order._id,
      paymentStatus: 'FAILED',
    });
  }

  private async handleOrderCancelled(payload: any) {
    const order = await orderService.getOrderByShiprocketId(payload.order_id);
    if (!order) return;

    await orderService.cancelOrder({
      orderId: order._id,
      cancellationReason: payload.reason || 'Cancelled via Shiprocket',
    });
  }

  private async handleOrderStatusUpdate(payload: any) {
    const order = await orderService.getOrderByShiprocketId(payload.order_id);
    if (!order) return;

    await orderService.updateOrderStatus({
      orderId: order._id,
      orderStatus: this.mapShipmentStatus(payload.shipment_status),
    });
  }

  private mapShipmentStatus(status: string) {
    const map: Record<string, string> = {
      PICKED_UP: 'PROCESSING',
      IN_TRANSIT: 'SHIPPED',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      RTO: 'RETURNED',
    };

    return map[status] || 'PROCESSING';
  }

  private resolveEventType(payload: any): string {
    if (payload.event) return payload.event;

    if (payload.status === 'SUCCESS') return 'ORDER_SUCCESS';
    if (payload.status === 'FAILED') return 'ORDER_FAILED';
    if (payload.status === 'CANCELLED') return 'ORDER_CANCELLED';

    if (payload.shipment_status) return 'ORDER_STATUS_UPDATE';

    return 'UNKNOWN';
  }

  private verifyIncomingHMAC(rawBody: string, receivedHmac?: string) {
    if (!receivedHmac) {
      throw new Error('Missing Shiprocket HMAC');
    }

    const computedHmac = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawBody)
      .digest('base64');

    const a = new Uint8Array(Buffer.from(computedHmac));
    const b = new Uint8Array(Buffer.from(receivedHmac));

    if (a.length !== b.length) {
      throw new Error('Invalid Shiprocket webhook signature');
    }

    const isValid = crypto.timingSafeEqual(a, b);

    if (!isValid) {
      throw new Error('Invalid Shiprocket webhook signature');
    }
  }
  

}

export default new ShiprocketWebhookService();