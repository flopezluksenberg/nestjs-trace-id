import { TraceIdMiddleware } from './trace-id.middleware';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

const req = { header: jest.fn() };
const res = { set: jest.fn() };

it('Calling middleware without trace id header. Expect to generate a random uuid, save it in the request and put this as a response header', async () => {
  const middleware = new TraceIdMiddleware();
  const expectedRandomUUID = 'random-uuid';

  jest
    .spyOn(crypto, 'randomUUID')
    .mockImplementationOnce(() => expectedRandomUUID);
  const runSpy = jest.spyOn(AsyncLocalStorage.prototype, 'run');

  const next = jest.fn();

  await middleware.use(
    req as unknown as Request,
    res as unknown as Response,
    next,
  );

  expect(res.set).toBeCalledWith(TraceIdMiddleware.Header, expectedRandomUUID);
  expect(req[TraceIdMiddleware.Header]).toBe(expectedRandomUUID);
  expect(runSpy).toBeCalledWith(req, next, null);
});

it('Calling middleware with trace id header. Expect to save it in the request and put this as a response header', async () => {
  const middleware = new TraceIdMiddleware();
  const traceId = 'some-trace-id';
  const randomTraceId = 'random-trace-id';

  jest.spyOn(crypto, 'randomUUID').mockImplementationOnce(() => randomTraceId);
  const runSpy = jest.spyOn(AsyncLocalStorage.prototype, 'run');

  req.header.mockImplementationOnce(() => traceId);
  const next = jest.fn();

  await middleware.use(
    req as unknown as Request,
    res as unknown as Response,
    next,
  );

  expect(res.set).toBeCalledWith(TraceIdMiddleware.Header, traceId);
  expect(req[TraceIdMiddleware.Header]).toBe(traceId);
  expect(runSpy).toBeCalledWith(req, next, null);
});

it('Intercepting Request without request context. Expect to return config without add any header', async () => {
  const middleware = new TraceIdMiddleware();
  const expectedRandomUUID = 'random-uuid';

  jest
    .spyOn(crypto, 'randomUUID')
    .mockImplementationOnce(() => expectedRandomUUID);
  const getStoreSpy = jest.spyOn(AsyncLocalStorage.prototype, 'getStore');

  const next = jest.fn();

  await middleware.use(
    req as unknown as Request,
    res as unknown as Response,
    next,
  );

  const [interceptRequest] = TraceIdMiddleware.interceptRequest();

  const config = { headers: {} };

  interceptRequest(config);

  expect(getStoreSpy).toBeCalled();
  expect(config).toEqual({ headers: {} });
});

it('Throwing an error during request interception. Expect to return config without add any header', async () => {
  const getStoreSpy = jest
    .spyOn(AsyncLocalStorage.prototype, 'getStore')
    .mockImplementationOnce(() => new Error());

  const [interceptRequest] = TraceIdMiddleware.interceptRequest();

  const config = { headers: {} };

  interceptRequest(config);

  expect(getStoreSpy).toBeCalled();
  expect(config).toEqual({ headers: {} });
});

it('Intercepting Request with request context. Expect to return config with trace id header', async () => {
  const middleware = new TraceIdMiddleware();
  const expectedRandomUUID = 'random-uuid';

  jest.spyOn(AsyncLocalStorage.prototype, 'getStore').mockReturnValue({
    [TraceIdMiddleware.Header]: expectedRandomUUID,
  });

  const next = jest.fn();

  await middleware.use(
    req as unknown as Request,
    res as unknown as Response,
    next,
  );

  const [interceptRequest] = TraceIdMiddleware.interceptRequest();

  const config = { headers: {} };

  interceptRequest(config);

  jest.restoreAllMocks();

  expect(config.headers).toEqual({
    [TraceIdMiddleware.Header]: expectedRandomUUID,
  });
});

it('Getting interceptor requeste error. Expect to reject the promise', async () => {
  const [, errorInterceptor] = TraceIdMiddleware.interceptRequest();

  const error = new Error('For testing purposes');

  try {
    await errorInterceptor(error as unknown);
    fail('Should not reach here!');
  } catch (e) {
    expect(e).toBe(error);
  }
});
