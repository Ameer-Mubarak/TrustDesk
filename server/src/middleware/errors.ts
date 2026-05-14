import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: 'validation_failed',
        message: 'The submitted data is invalid.',
        fields: error.flatten().fieldErrors
      }
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  return res.status(500).json({ error: { code: 'internal_error', message: 'The request could not be completed.' } });
}
