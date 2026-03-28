import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(err.message, err);

  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
};