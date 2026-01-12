import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,

    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: "India",
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      index: true,
    },

    email: {
      type: String,
      index: true,
    },

    addresses: [addressSchema],

    lastCheckoutAt: Date,
  },
  { timestamps: true }
);

export interface IUser {
  _id: string;
  phone?: string;
  email?: string;
  addresses?: {
    name?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  }[];
}

export default mongoose.model<IUser>("User", userSchema);
