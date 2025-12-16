import mongoose, { Document } from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  }, 
  quantity: { 
    type: Number, 
    required: true 
  },
  size: { 
    type: String, 
    required: true 
  },
  color: {
    colorName: { 
      type: String, 
      required: true 
    },
    colorHex: { 
      type: String, 
      required: true 
    },
  },
  selectedImage: { 
    type: String, 
    required: true 
  },
  hsn: { 
    type: String
  },
  gstRate: { 
    type: Number, 
    default: 5
  },
});

const addressSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: "India" },
});

const paymentSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ["shiprocket"],
    required: true,
  },
  method: {
    type: String,
    enum: ["upi", "card", "netbanking", "cod"],
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  transactionId: String,
  amount: Number,
  paidAt: Date,
  raw: mongoose.Schema.Types.Mixed,
});

const shipmentSchema = new mongoose.Schema({
  provider: { type: String, default: "shiprocket" },
  shipmentId: Number,
  awb: String,
  courierName: String,
  status: {
    type: String,
    enum: [
      "pending",
      "pickup_scheduled",
      "in_transit",
      "delivered",
      "rto",
      "cancelled",
    ],
  },
  trackingUrl: String,
  estimatedDelivery: Date,
  raw: mongoose.Schema.Types.Mixed,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
    sessionId: {
      type: String,
      index: true,
    },
    isGuestOrder: {
      type: Boolean,
      default: false,
    },
    items: [orderItemSchema],
    subtotal: Number,
    discountAmount: Number,
    shippingAmount: Number,
    totalAmount: Number,
    appliedCoupon: {
      code: String,
      discountAmount: Number,
    },
    appliedVoucher: {
      code: String,
      discountAmount: Number,
    },
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    payment: paymentSchema,
    shipment: shipmentSchema,
    status: {
      type: String,
      enum: [
        "created",
        "payment_pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "created",
    },
    source: {
      type: String,
      enum: ["web", "mobile"],
      default: "web",
    },
  },
  { timestamps: true }
);

export interface IOrder extends Document {}

export default mongoose.model<IOrder>("Order", orderSchema);