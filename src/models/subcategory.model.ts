import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    
    description: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    
    image: {
      type: String,
      trim: true,
    },
    
    // Shiprocket Collection ID - stored after syncing with Shiprocket
    shiprocketCollectionId: {
      type: String,
      index: true,
    },
    
    hsn: {
      type: String,
      trim: true,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for search and filtering
subcategorySchema.index({ categoryId: 1, isActive: 1 });
subcategorySchema.index({ name: 'text', description: 'text' });

// Compound unique index to prevent duplicate subcategory names within same category
subcategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });

export interface ISubcategory {
  _id: string;
  name: string;
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  image?: string;
  shiprocketCollectionId?: string;
  hsn?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default mongoose.model<ISubcategory & mongoose.Document>('Subcategory', subcategorySchema);