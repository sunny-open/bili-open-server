import Router from '@koa/router';
import { BusinessError, api } from '../tools/request.js';
import { authH5Params } from '../tools/auth.js';
import { wrapResponseData } from '../tools/response.js';

const router = new Router();

const APP_ID = Number(process.env.BILI_APP_ID);

// 开启路由
// router.post("/start", async (ctx) => {
//   const data = await api.GameStart({ app_id: APP_ID, code: 'C1YMHZ63UBCW5' });
//   ctx.body = wrapResponseData(data);
// })

// 关闭路由
router.post('/stop', async (ctx) => {
  const { game_id } = ctx.request.body;
  const data = await api.GameEnd({ app_id: APP_ID, game_id });
  ctx.body = wrapResponseData(data);
});

// 保活心跳路由
router.post('/keepalive', async (ctx) => {
  const { game_id } = ctx.request.body;
  const data = await api.GameHeartbeat({ game_id });
  ctx.body = wrapResponseData(data);
});

// H5 应用验证
router.post('/auth', async (ctx) => {
  const params = ctx.query;
  const authResult = authH5Params(params);
  if (authResult === null) {
    throw new BusinessError(2101, 'Auth Failed');
  }

  const { code } = authResult;
  const data = await api.GameStart({ app_id: APP_ID, code });
  ctx.body = wrapResponseData(data);
});

export default router;
