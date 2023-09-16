import { BusinessError } from './request.js';

export function wrapResponseData(data: unknown) {
  return {
    code: 0,
    message: 'ok',
    data,
  };
}

export function wrapResponseError(error: unknown) {
  if (error instanceof BusinessError) {
    return {
      code: error.code,
      message: error.message,
      error: error.detail,
    };
  }

  const code = -500;
  const message = 'server error';
  let errorMessage = Object.prototype.toString.call(error);

  if (error && typeof error === 'object' && 'toString' in error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    errorMessage = error.toString();
  }

  return {
    code,
    message,
    error: errorMessage,
  };
}
