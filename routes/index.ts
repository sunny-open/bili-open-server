import Router from '@koa/router';
import { BusinessError, api } from '../tools/request.js';
import { authH5Params } from '../tools/auth.js';
import { wrapResponseData } from '../tools/response.js';
import { Synthesizer } from '../extension-tts/index.js';

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

// tts
let ttsInstance: Synthesizer;
router.post('/tts', async (ctx) => {
  const params = ctx.query;
  const authResult = authH5Params(params);
  if (authResult === null) {
    throw new BusinessError(2101, 'Auth Failed');
  }

  const { voice, text, token } = ctx.request.body;
  if (token !== 'example token') {
    throw new BusinessError(2104, 'Provide Token');
  }

  if (!ttsInstance) {
    ttsInstance = new Synthesizer({ voice });
  }

  try {
    const result = await ttsInstance.speakText(text as string);
    ctx.set('Content-Type', 'audio/wav');
    ctx.body = result.asStream();
  } catch (e: unknown) {
    throw new BusinessError(
      2104,
      'Extension Error',
      e instanceof Error ? e.message : Object.prototype.toString.call(e),
    );
  }
});

export default router;
