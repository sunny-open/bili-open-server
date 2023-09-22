import 'dotenv/config';

import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';

import router from './routes/index.js';
import { wrapResponseError } from './tools/response.js';
import { PredefinedError } from './types/error.js';
import { logger } from './tools/logger.js';

const app = new Koa();

app.use(bodyParser());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e: unknown) {
    const response = wrapResponseError(e);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (response.code !== PredefinedError.E_AUTH_FAILED && response.code !== 7003) {
      // 7003 是心跳过期，可能开了另外一个实例
      logger(ctx, `E-RES`, response);
    }

    ctx.body = response;
  }

  // typescript 似乎不支持条件编译？
  if (process.env.npm_lifecycle_event === 'start') {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  }
});

// 开启router
app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
  ctx.body = 'bilibili创作者服务中心';
});

const protocol = 'http';
const host = '127.0.0.1';
const port = process.env.BILI_PORT ? Number.parseInt(process.env.BILI_PORT, 10) : 3000;

app.listen(port, () => {
  console.log(`Listening on ${protocol}://${host}:${port}`);
});
