import subcategoryModel, { ISubcategory } from '../models/subcategory.model';
import mongoose from 'mongoose';

export interface ICreateSubcategoryParams {
  name: string;
  categoryId: string;
  description?: string;
  image?: string;
  shiprocketCollectionId?: string;
  hsn?: string;
  isActive?: boolean;
}

export interface IUpdateSubcategoryParams {
  _id: string;
  name?: string;
  categoryId?: string;
  description?: string;
  image?: string;
  shiprocketCollectionId?: string;
  hsn?: string;
  isActive?: boolean;
}

export class SubcategoryRepository {
  private _model = subcategoryModel;

  async createSubcategory(params: ICreateSubcategoryParams): Promise<ISubcategory> {
    return this._model.create({
      name: params.name,
      categoryId: new mongoose.Types.ObjectId(params.categoryId),
      description: params.description || '',
      image: params.image || '',
      shiprocketCollectionId: params.shiprocketCollectionId,
      hsn: params.hsn || '',
      isActive: params.isActive !== undefined ? params.isActive : true,
    });
  }

  async getSubcategoryById(id: string): Promise<ISubcategory | null> {
    return this._model.findById(id).populate('categoryId');
  }

  async getSubcategoriesByCategoryId(categoryId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const subcategories = await this._model.find({
      categoryId: new mongoose.Types.ObjectId(categoryId),
    })
      .populate('categoryId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this._model.countDocuments({
      categoryId: new mongoose.Types.ObjectId(categoryId),
    });

    return {
      subcategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllSubcategories(page = 1, limit = 100, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const subcategories = await this._model.find(filter)
      .populate('categoryId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this._model.countDocuments(filter);

    return {
      subcategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateSubcategory(params: IUpdateSubcategoryParams): Promise<ISubcategory | null> {
    const { _id, ...updateData } = params;

    const updateObject: any = {};

    if (updateData.name) updateObject.name = updateData.name;
    if (updateData.categoryId) updateObject.categoryId = new mongoose.Types.ObjectId(updateData.categoryId);
    if (updateData.description !== undefined) updateObject.description = updateData.description;
    if (updateData.image !== undefined) updateObject.image = updateData.image;
    if (updateData.shiprocketCollectionId !== undefined) updateObject.shiprocketCollectionId = updateData.shiprocketCollectionId;
    if (updateData.hsn !== undefined) updateObject.hsn = updateData.hsn;
    if (updateData.isActive !== undefined) updateObject.isActive = updateData.isActive;

    return this._model.findByIdAndUpdate(_id, updateObject, { new: true }).populate('categoryId');
  }

  async deleteSubcategory(id: string): Promise<ISubcategory | null> {
    return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}