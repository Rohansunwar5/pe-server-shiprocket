import mongoose from 'mongoose'; 

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    image: {
      type: String,
    },
    hsn: {
      type: String,      // HSN Code (optional)
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text', description: 'text' });

export interface ICategory extends mongoose.Document {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  hsn?: string;      // <-- Add here
  isActive: boolean;
}

export default mongoose.model<ICategory>('Category', categorySchema);