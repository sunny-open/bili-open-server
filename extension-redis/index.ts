import { Redis, type RedisKey } from 'ioredis';

let _client: Redis | undefined;

const _initClient = () => {
  if (_client) {
    return _client;
  }

  const { REDIS_ADDRESS } = process.env;
  if (!REDIS_ADDRESS) {
    throw new Error(`set \`REDIS_ADDRESS\` in \`.env\``);
  }

  _client = new Redis(REDIS_ADDRESS, {
    scripts: {
      incrbyex: {
        numberOfKeys: 1,
        // redis 6.0 doesn't support EXPIRE NX...
        lua: `local r = redis.call('INCRBY', KEYS[1], ARGV[1]) redis.call('EXPIREAT', KEYS[1], ARGV[2]) return r`,
      },
    },
  });
  return _client;
};

type ExtendedRedis = {
  incrbyex(key: RedisKey, count: number, ts: number): Promise<string>;
};

export const client = new Proxy({} as Redis & ExtendedRedis, {
  get(t, p, r) {
    return Reflect.get(_initClient(), p, r) as unknown;
  },
});
