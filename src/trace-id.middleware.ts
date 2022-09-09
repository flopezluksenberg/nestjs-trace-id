import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AxiosRequestConfig } from 'axios';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  static Header = 'X-Trace-Id';
  private static RequestContext = new AsyncLocalStorage<Request>();

  use(req: Request, res: Response, next: NextFunction) {
    let traceId = req.header(TraceIdMiddleware.Header);

    if (traceId == null) {
      traceId = randomUUID();
    }

    req[TraceIdMiddleware.Header] = traceId;
    res.set(TraceIdMiddleware.Header, traceId);

    TraceIdMiddleware.RequestContext.run(req, next, null);
  }

  static interceptRequest() {
    return [
      (config: AxiosRequestConfig): AxiosRequestConfig => {
        try {
          const req = TraceIdMiddleware.RequestContext.getStore();

          if (req == null) {
            return config;
          }

          const traceId = req[TraceIdMiddleware.Header];

          config.headers[TraceIdMiddleware.Header] = traceId;

          return config;
        } catch (err) {
          return config;
        }
      },
      (error: any): Promise<any> => Promise.reject(error),
    ];
  }
}
