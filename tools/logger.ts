import { type ParameterizedContext } from 'koa';
import { type State } from '../types/index.js';

export function getEntryKey(ctx: ParameterizedContext<State>) {
  const { auth } = ctx.state;
  if (auth?.user_id) {
    return `u-${auth.user_id}`;
  }

  if (auth) {
    return `i-${auth.code}`;
  }

  return 'unauthorized';
}

export function logger(ctx: ParameterizedContext<State>, type: string, ...extra: unknown[]) {
  const user = getEntryKey(ctx);

  console.log(`[${type}] {${user}}`, ...extra);
}
