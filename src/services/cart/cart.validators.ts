
import { BadRequestError } from '../../errors/bad-request.error';
import { NotFoundError } from '../../errors/not-found.error';
import productService from '../product.service';


export async function validateProductAndVariant(productId: string, colorName: string, size: string) {
if (!productId) throw new BadRequestError('Product id is required');


const product = await productService.getProductById(productId);
if (!product || !product.isActive) throw new NotFoundError('Product not found or inactive');


const colorVariant = product.colors.find((c: any) => c.colorName === colorName);
if (!colorVariant) throw new BadRequestError('Selected color is not available for this product');


const sizeStock = colorVariant.sizeStock.find((s: any) => s.size === size);
if (!sizeStock) throw new BadRequestError('Selected size is not available for this color');


return { product, colorVariant, sizeStock };
}


export function validateSelectedImage(colorVariant: any, selectedImage: string) {
if (!selectedImage) throw new BadRequestError('Selected image is required');
if (!Array.isArray(colorVariant.images) || !colorVariant.images.includes(selectedImage)) {
throw new BadRequestError('Selected image does not belong to this color');
}
}


export function ensureQuantityWithinStock(quantity: number, sizeStock: any) {
if (quantity <= 0) throw new BadRequestError('Quantity must be greater than zero');
if (quantity > sizeStock.stock) throw new BadRequestError(`Only ${sizeStock.stock} available`);
}