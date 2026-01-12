// product.service.ts
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { InternalServerError } from '../errors/internal-server.error';
import {
  ProductRepository,
  ICreateProductParams,
  IUpdateProductParams,
  IGetProductsParams,
} from '../repository/product.repository';
import { ProductVariantRepository } from '../repository/productVariant.repository';
import shiprocketWebhookService from './shiprocketWebhook.service';

class ProductService {
  constructor(
    private readonly _productRepository: ProductRepository,
    private readonly _variantRepository: ProductVariantRepository
  ) {}

  async createProduct(params: ICreateProductParams) {
    const existingProduct = await this._productRepository.getProductByCode(params.productCode);
    if (existingProduct) {
      throw new BadRequestError('Product code already exists');
    }

    const existingSlug = await this._productRepository.getProductBySlug(params.slug);
    if (existingSlug) {
      throw new BadRequestError('Slug already exists');
    }

    const product = await this._productRepository.createProduct(params);
    if (!product) {
      throw new InternalServerError('Failed to create product');
    }

    return product;
  }

  async getProductById(id: string) {
    const product = await this._productRepository.getProductById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getProductBySlug(slug: string) {
    const product = await this._productRepository.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getProducts(params: IGetProductsParams) {
    return this._productRepository.getProducts(params);
  }

  async updateProduct(params: IUpdateProductParams) {
    const product = await this._productRepository.updateProduct(params);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    try {
      await shiprocketWebhookService.sendProductUpdateWebhook(product._id.toString());
    } catch (error) {
      console.error('Failed to send webhook to Shiprocket:', error);
    }

    return product;
  }

  async deleteProduct(id: string) {
    const product = await this._productRepository.deleteProduct(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return { message: 'Product deleted successfully' };
  }

  async getProductWithVariants(productId: string) {
    const product = await this._productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const { variants } = await this._variantRepository.getVariantsByProductId(productId, 1, 1000);

    return {
      product,
      variants,
    };
  }

  async getProductsByCategory(categoryId: string, page = 1, limit = 100) {
    return this._productRepository.getProductsByCategory(categoryId, page, limit);
  }

  // Helper method to sync product metrics when variants change
  async syncProductMetrics(productId: string) {
    const { variants } = await this._variantRepository.getVariantsByProductId(productId, 1, 1000);
    const activeVariants = variants.filter(v => v.isActive);

    if (activeVariants.length === 0) {
      await this._productRepository.syncProductMetrics(productId, {
        totalStock: 0,
        basePrice: 0,
      });
      return;
    }

    const prices = activeVariants.map(v => v.price);
    const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0);

    await this._productRepository.syncProductMetrics(productId, {
      totalStock,
      basePrice: Math.min(...prices),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
    });
  }
}

export default new ProductService(new ProductRepository(), new ProductVariantRepository());