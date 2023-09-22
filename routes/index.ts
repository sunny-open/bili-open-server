import Router from '@koa/router';
import { BusinessError, api } from '../tools/request.js';
import { wrapResponseData } from '../tools/response.js';
import { Synthesizer } from '../extension-tts/index.js';
import { checkTTSLimit } from '../extension-tts/limit.js';
import { authMiddleware } from '../middlewares/auth.js';
import { type State } from '../types/index.js';
import { PredefinedError } from '../types/error.js';
import { logger } from '../tools/logger.js';

const router = new Router<State>();

const APP_ID = Number(process.env.BILI_APP_ID);

// 开启路由
// router.post("/start", async (ctx) => {
//   const data = await api.GameStart({ app_id: APP_ID, code: 'C1YMHZ63UBCW5' });
//   ctx.body = wrapResponseData(data);
// })

// 关闭路由
router.post('/stop', authMiddleware, async (ctx) => {
  const { game_id } = ctx.request.body;
  const data = await api.GameEnd({ app_id: APP_ID, game_id });
  ctx.body = wrapResponseData(data);
});

// 保活心跳路由
router.post('/keepalive', authMiddleware, async (ctx) => {
  const { game_id } = ctx.request.body;
  const data = await api.GameHeartbeat({ game_id });
  ctx.body = wrapResponseData(data);
});

// H5 应用验证
router.post('/auth', authMiddleware, async (ctx) => {
  const { code } = ctx.state.auth;
  const data = await api.GameStart({ app_id: APP_ID, code });
  ctx.body = wrapResponseData(data);
});

// tts
router.post('/tts', authMiddleware, async (ctx) => {
  const { code, user_id } = ctx.state.auth;

  const { voice, text } = ctx.request.body;
  logger(ctx, 'I-REQ', `request tts |${text.length}|`);

  await checkTTSLimit(ctx, { text });

  const ttsInstance = new Synthesizer({ voice });

  try {
    const result = await ttsInstance.speakText(text as string);
    ctx.set('Content-Type', 'audio/wav');
    ctx.body = result.asStream();
  } catch (e: unknown) {
    throw new BusinessError(
      PredefinedError.E_EXTENSION_ERROR,
      'extension error',
      e instanceof Error ? e.message : Object.prototype.toString.call(e),
    );
  } finally {
    ttsInstance.done();
  }
});

export default router;
