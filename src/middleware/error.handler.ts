import { HttpStatus } from '@/helper/http-status.constant';
import type { NextFunction, Request, Response } from 'express';

export const ErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const RESPONSE = {
    status: (error as any)?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
    message: error?.message ?? HttpStatus.INTERNAL_SERVER_ERROR_MESSAGE,
    data: null as any,
    success: false,
  };

  res.status(RESPONSE.status).json(RESPONSE);
};
