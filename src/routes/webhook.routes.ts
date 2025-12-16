import { Router } from "express";
import { shiprocketWebhook } from "../controllers/shiprocket.webhook.controller";
import { asyncHandler } from "../utils/asynchandler";

const webhook = Router();

// NO auth middleware
webhook.post("/shiprocket", asyncHandler(shiprocketWebhook));

export default webhook;
