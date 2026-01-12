import { Request, Response, NextFunction } from 'express';
import shiprocketCheckoutService from '../services/shiprocketCheckout.service';

export const generateCheckoutToken = async (req:Request, res:Response, next:NextFunction) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'] as string;

  const token = await shiprocketCheckoutService.generateToken({
    userId,
    sessionId,
  });

  res.json({ token });
};
