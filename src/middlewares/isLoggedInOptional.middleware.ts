import { Request, Response, NextFunction } from "express";
import getAuthMiddlewareByJWTSecret from "./auth/verify-token.middleware";
import config from "../config";

const optionalVerify = getAuthMiddlewareByJWTSecret(config.JWT_SECRET);

export default async function isLoggedInOptional(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // No token → treat as guest
  if (!authHeader) {
    req.user = { _id: "" };
    return next();
  }

  try {
    // Try verifying the token
    await new Promise<void>((resolve, reject) => {
      optionalVerify(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return next();
  } catch (error) {
    console.warn("Optional Auth: Token invalid → continuing as guest");
    req.user = { _id: "" };
    return next();
  }
}
