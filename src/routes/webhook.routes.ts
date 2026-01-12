import { Router } from 'express';
import { shiprocketOrderWebhook } from '../controllers/shiprocket.webhook.controller';
import { asyncHandler } from '../utils/asynchandler';

const webhookRouter = Router();

// webhookRouter.post('/shiprocket', asyncHandler());
webhookRouter.post('/shiprocket/order', asyncHandler(shiprocketOrderWebhook));

export default webhookRouter;