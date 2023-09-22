import { type ParameterizedContext } from 'koa';
import { client } from '../extension-redis/index.js';
import { BusinessError } from '../tools/request.js';
import { PredefinedError } from '../types/error.js';
import { type State } from '../types/index.js';
import { getEntryKey, logger } from '../tools/logger.js';

type Params = {
  text: string;
};

const LIMIT = 1000;

const getExpireAt = () => {
  const todayEnd = new Date().setHours(23, 59, 59, 999);
  return Math.floor(todayEnd / 1000);
};

export async function checkTTSLimit(ctx: ParameterizedContext<State>, params: Params) {
  const { text } = params;
  const todo = text.length + 2;
  const key = getEntryKey(ctx);
  const expireAt = getExpireAt();

  try {
    const result = await client.incrbyex(key, todo, expireAt);

    logger(ctx, `I-TTS-LIMIT`, `${todo}-${result}`);

    if (result) {
      const current = Number.parseInt(result, 10);
      if (current < LIMIT) {
        return true;
      }
    }
  } catch (e) {
    throw new BusinessError(PredefinedError.E_LIMIT_EXCEED, `limit query failed`);
  }

  throw new BusinessError(PredefinedError.E_LIMIT_EXCEED, `limit exceed`);
}
