import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { BadRequestError } from '../../errors/bad-request.error';

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(
      errors
        .array()
        .map((err) => err.msg)
        .join(', ')
    );
  }
  next();
};

export const updateOrderStatusValidator = [
  body('orderStatus')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ])
    .withMessage('Invalid order status'),
  handleValidationErrors,
];

export const cancelOrderValidator = [
  body('cancellationReason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isString()
    .withMessage('Cancellation reason must be a string')
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters'),
  handleValidationErrors,
];