import { type ParameterizedContext } from 'koa';
import { authH5Params } from '../tools/auth.js';
import { BusinessError } from '../tools/request.js';
import { PredefinedError } from '../types/error.js';

export async function authMiddleware(ctx: ParameterizedContext, next: () => Promise<any>) {
  const params = ctx.query;
  const authResult = authH5Params(params);
  if (authResult === null) {
    throw new BusinessError(PredefinedError.E_AUTH_FAILED, 'Auth Failed');
  }

  ctx.state.auth = authResult;

  await next();
}
