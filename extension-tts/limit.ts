import { client } from '../extension-redis/index.js';
import { BusinessError } from '../tools/request.js';

type Params = {
  uid?: number;
  code: string;
  text: string;
};

const LIMIT = 1000;

const getExpireAt = () => {
  const todayEnd = new Date().setHours(23, 59, 59, 999);
  return Math.floor(todayEnd / 1000);
};

export async function checkTTSLimit(params: Params) {
  const { text, code, uid } = params;
  const todo = text.length + 2;
  const key = uid ? `uid-${uid}` : `insecure-${code}`;
  const expireAt = getExpireAt();

  try {
    const result = await client.incrbyex(key, todo, expireAt);

    console.log(`[TTS-LIMIT] ${key}-${todo}-${result}`);

    if (result) {
      const current = Number.parseInt(result, 10);
      if (current < LIMIT) {
        return true;
      }
    }
  } catch (e) {
    throw new BusinessError(4290, `limit query failed`);
  }

  throw new BusinessError(4290, `limit exceed`);
}
