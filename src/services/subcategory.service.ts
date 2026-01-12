import { NotFoundError } from '../errors/not-found.error';
import { InternalServerError } from '../errors/internal-server.error';
import { CategoryRepository } from '../repository/category.repository';
import { SubcategoryRepository, ICreateSubcategoryParams, IUpdateSubcategoryParams } from '../repository/subcategory.repository';
import shiprocketWebhookService from './shiprocketWebhook.service';

class SubcategoryService {
  constructor(
    private readonly _subcategoryRepository: SubcategoryRepository,
    private readonly _categoryRepository: CategoryRepository
  ) {}

  async createSubcategory(params: ICreateSubcategoryParams) {
    const category = await this._categoryRepository.getCategoryById(params.categoryId);
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const subcategory = await this._subcategoryRepository.createSubcategory(params);

    if (!subcategory) {
      throw new InternalServerError('Failed to create subcategory');
    }

    // Sync with Shiprocket if needed
    this.syncWithShiprocket(subcategory._id.toString()).catch(err => {
      console.error('Shiprocket sync failed:', err);
    });
    
    return subcategory;
  }

  async getSubcategoryById(id: string) {
    const subcategory = await this._subcategoryRepository.getSubcategoryById(id);

    if (!subcategory) {
      throw new NotFoundError('Subcategory not found');
    }

    return subcategory;
  }

  async getSubcategoriesByCategoryId(categoryId: string, page = 1, limit = 100) {
    return this._subcategoryRepository.getSubcategoriesByCategoryId(categoryId, page, limit);
  }

  async getAllSubcategories(page = 1, limit = 100, isActive?: boolean) {
    return this._subcategoryRepository.getAllSubcategories(page, limit, isActive);
  }

  async updateSubcategory(params: IUpdateSubcategoryParams) {
    if (params.categoryId) {
      const category = await this._categoryRepository.getCategoryById(params.categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const subcategory = await this._subcategoryRepository.updateSubcategory(params);

    if (!subcategory) {
      throw new NotFoundError('Subcategory not found');
    }

    // Sync with Shiprocket
    this.syncWithShiprocket(subcategory._id.toString()).catch(err => {
      console.error('Shiprocket sync failed:', err);
    });

    return subcategory;
  }

  async deleteSubcategory(id: string) {
    const subcategory = await this._subcategoryRepository.deleteSubcategory(id);

    if (!subcategory) {
      throw new NotFoundError('Subcategory not found');
    }

    return { message: 'Subcategory deleted successfully' };
  }

  private async syncWithShiprocket(subcategoryId: string) {
    try {
      await shiprocketWebhookService.sendCollectionUpdateWebhook(subcategoryId);
      console.log(`Subcategory ${subcategoryId} synced with Shiprocket`);
    } catch (error) {
      console.error(`Failed to sync subcategory ${subcategoryId} with Shiprocket:`, error);
    }
  }
}

export default new SubcategoryService(new SubcategoryRepository(), new CategoryRepository());