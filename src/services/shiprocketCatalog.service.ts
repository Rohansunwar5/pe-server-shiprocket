import { ProductRepository } from '../repository/product.repository';
import { ProductVariantRepository } from '../repository/productVariant.repository';
import { CategoryRepository } from '../repository/category.repository';
import { NotFoundError } from '../errors/not-found.error';
import { IProduct } from '../models/product.model';
import { IProductVariant } from '../models/productVariant.model';

interface ShiprocketProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  updated_at: string;
  status: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    quantity: number;
    sku: string;
    updated_at: string;
    image: {
      src: string;
    };
    weight: number;
  }>;
  image: {
    src: string;
  };
}

class ShiprocketCatalogService {
  constructor(
    private readonly _productRepository: ProductRepository,
    private readonly _variantRepository: ProductVariantRepository,
    private readonly _categoryRepository: CategoryRepository
  ) {}

  async fetchProducts(page = 1, limit = 100) {
    const { products, pagination } = await this._productRepository.getProducts({
      page,
      limit,
      isActive: true,
    });

    const shiprocketProducts: ShiprocketProduct[] = [];

    for (const product of products) {
      const { variants } = await this._variantRepository.getVariantsByProductId(
        product._id.toString(),
        1,
        1000
      );

      const validVariants = variants.filter(
        v => v.isActive && !!v.shiprocketVariantId
      );

      if (validVariants.length === 0) {
        continue; 
      }

      const category = await this._categoryRepository.getCategoryById(
        product.categoryId.toString()
      );

      const productDoc = product as IProduct & { updatedAt?: Date };
      const firstVariant = validVariants[0];

      shiprocketProducts.push({
        id: product._id.toString(),
        title: product.name,
        body_html: product.description || '',
        vendor: 'Navkar Flowers',
        product_type: category?.name || '',
        updated_at: productDoc.updatedAt?.toISOString() || new Date().toISOString(),
        status: 'active',
        variants: validVariants.map(variant => {
          const variantDoc = variant as IProductVariant & { updatedAt?: Date };

          return {
            id: variant.shiprocketVariantId!, // ✅ guaranteed
            title: this.formatVariantTitle(variant.attributes),
            price: variant.price.toString(),
            quantity: variant.stock,
            sku: variant.sku,
            updated_at: variantDoc.updatedAt?.toISOString() || new Date().toISOString(),
            image: { src: variant.image },
            weight: variant.weight,
          };
        }),
        image: {
          src: firstVariant.image,
        },
      });
    }

    return {
      data: shiprocketProducts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total_pages: pagination.totalPages,
        total_records: pagination.total,
      },
    };
  }



  async fetchProductsByCollection(collectionId: string, page = 1, limit = 100) {
    const { products, pagination } = await this._productRepository.getProductsByCategory(
      collectionId,
      page,
      limit
    );

    const shiprocketProducts: ShiprocketProduct[] = [];

    for (const product of products) {
      const { variants } = await this._variantRepository.getVariantsByProductId(
        product._id.toString(),
        1,
        1000
      );

      const validVariants = variants.filter(
        v => v.isActive && !!v.shiprocketVariantId
      );

      if (validVariants.length === 0) {
        continue;
      }

      const category = await this._categoryRepository.getCategoryById(
        product.categoryId.toString()
      );

      const productDoc = product as IProduct & { updatedAt?: Date };
      const firstVariant = validVariants[0];

      shiprocketProducts.push({
        id: product._id.toString(),
        title: product.name,
        body_html: product.description || '',
        vendor: 'Your Store Name',
        product_type: category?.name || '',
        updated_at: productDoc.updatedAt?.toISOString() || new Date().toISOString(),
        status: product.isActive ? 'active' : 'inactive',
        variants: validVariants.map(variant => {
          const variantDoc = variant as IProductVariant & { updatedAt?: Date };

          return {
            id: variant.shiprocketVariantId!, // ✅ strict
            title: this.formatVariantTitle(variant.attributes),
            price: variant.price.toString(),
            quantity: variant.stock,
            sku: variant.sku,
            updated_at: variantDoc.updatedAt?.toISOString() || new Date().toISOString(),
            image: { src: variant.image },
            weight: variant.weight,
          };
        }),
        image: {
          src: firstVariant.image,
        },
      });
    }

    return {
      data: shiprocketProducts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total_pages: pagination.totalPages,
        total_records: pagination.total,
      },
    };
  }


  async fetchCollections(page = 1, limit = 100) {
    const { categories, pagination } = await this._categoryRepository.getCategories({
      page,
      limit,
      isActive: true,
    });

    const shiprocketCollections = categories.map(category => {
      const categoryDoc = category as any;
      return {
        id: categoryDoc.shiprocketCollectionId || category._id.toString(),
        updated_at: categoryDoc.updatedAt?.toISOString() || new Date().toISOString(),
        title: category.name,
        body_html: category.description || '',
        image: {
          src: category.image || '',
        },
      };
    });

    return {
      data: shiprocketCollections,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total_pages: pagination.totalPages,
        total_records: pagination.total,
      },
    };

  }

  private formatVariantTitle(attributes: { size?: string; colorName?: string; colorHex?: string }): string {
    const parts: string[] = [];
    
    if (attributes.colorName) {
      parts.push(attributes.colorName);
    }
    
    if (attributes.size) {
      parts.push(attributes.size);
    }
    
    return parts.length > 0 ? parts.join(' / ') : 'Default';
  }

  async formatProductUpdateWebhook(productId: string) {
    const product = await this._productRepository.getProductById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const { variants } = await this._variantRepository.getVariantsByProductId(
      product._id.toString(),
      1,
      1000
    );

    const activeVariants = variants.filter(v => v.isActive);

    if (activeVariants.some(v => !v.shiprocketVariantId)) {
      throw new Error(
        `All active variants must be synced with Shiprocket before webhook update`
      );
    }

    const category = await this._categoryRepository.getCategoryById(
      product.categoryId.toString()
    );

    const productDoc = product as IProduct & { updatedAt?: Date };
    const firstVariant = activeVariants[0];

    return {
      id: product._id.toString(),
      title: product.name,
      body_html: product.description || '',
      vendor: 'Your Store Name',
      product_type: category?.name || '',
      updated_at: productDoc.updatedAt?.toISOString() || new Date().toISOString(),
      status: product.isActive ? 'active' : 'inactive',
      variants: activeVariants.map(variant => {
        const variantDoc = variant as IProductVariant & { updatedAt?: Date };

        return {
          id: variant.shiprocketVariantId!, // ✅ enforced
          title: this.formatVariantTitle(variant.attributes),
          price: variant.price.toString(),
          quantity: variant.stock,
          sku: variant.sku,
          updated_at: variantDoc.updatedAt?.toISOString() || new Date().toISOString(),
          image: { src: variant.image },
          weight: variant.weight,
        };
      }),
      image: {
        src: firstVariant.image,
      },
    };
  }


  private ensureShiprocketVariantId(variant: IProductVariant): string | null {
    if (!variant.shiprocketVariantId) {
      return null; 
    }
    return variant.shiprocketVariantId;
  }

}

export default new ShiprocketCatalogService(
  new ProductRepository(), 
  new ProductVariantRepository(),
  new CategoryRepository()
);