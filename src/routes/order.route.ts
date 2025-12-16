import { asyncHandler } from "../utils/asynchandler";
import isLoggedIn from "../middlewares/isLoggedIn.middleware";
import {
  createOrder,
  getOrderById,
  getMyOrders
} from "../controllers/order.controller";
import { Router } from "express";

const orderRouter = Router();

/**
 * Create order (guest or user)
 */
orderRouter.post("/", asyncHandler(createOrder));

/**
 * Logged-in user orders
 */
orderRouter.get("/my", isLoggedIn, asyncHandler(getMyOrders));

/**
 * Get order by id
 */
orderRouter.get("/:orderId", asyncHandler(getOrderById));

export default orderRouter;
