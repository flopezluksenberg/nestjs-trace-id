/* istanbul ignore file */
import { MiddlewareConsumer, Module, NestModule, OnApplicationBootstrap } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { TraceIdMiddleware } from './trace-id.middleware';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class TraceIdModule implements NestModule, OnApplicationBootstrap {
  constructor(private readonly httpService: HttpService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }

  onApplicationBootstrap() {
    this.httpService.axiosRef.interceptors.request.use(
      ...TraceIdMiddleware.interceptRequest(),
    );
  }
}
