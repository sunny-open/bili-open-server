import JSONBig from 'json-bigint';
import { getEncodeHeader } from './auth.js';

// json-parse-with-source is now Stage 3, implemented in Chrome stable 116
// https://github.com/tc39/proposal-json-parse-with-source
const JSON = JSONBig({ storeAsString: true, strict: true });

const BASE_URL = 'https://live-open.biliapi.com';
const BASE_URL_TEST = 'http://test-live-open.biliapi.net';

export function getUrl(url: string) {
  const base = process.env.node_env === 'test' ? BASE_URL_TEST : BASE_URL;
  return `${base}${url}`;
}

export type BusinessResponse<T = unknown> = {
  code: number;
  message: string;
  request_id: string;
  data: T;
};

export class BusinessError extends Error {
  code: number;
  message: string;
  detail: string | undefined | null;
  constructor(code: number, message: string, detail?: string | undefined | null) {
    const desc = `[${code}] ${message}`;
    super(desc);

    this.code = code;
    this.message = message;
    this.detail = detail;
  }
}

export async function api<T = unknown>(_url: string, _body: object): Promise<T> {
  const url = getUrl(_url);
  const body = JSON.stringify(_body);
  const init: RequestInit = {
    method: 'POST',
    body,
    headers: getEncodeHeader(body),
  };
  const res = await fetch(url, init);
  const { status, statusText } = res;
  let resBody: string | Error;
  try {
    resBody = await res.text();
  } catch (e) {
    resBody = e as Error;
  }

  if (status === 200 && typeof resBody === 'string') {
    const response = JSON.parse(resBody) as BusinessResponse<T>;
    if (response.code === 0) {
      // 0 = success, >0 = business error, <0 = server error
      return response.data;
    }

    throw new BusinessError(response.code, response.message);
  }

  const errorDescription = typeof resBody === 'string' ? resBody || null : resBody.toString();
  throw new BusinessError(-1, `${statusText} (${status})`, errorDescription);
}

// GameStart
export namespace api {
  export type GameStartRequest = {
    code: string;
    app_id: number;
  };

  export type GameStartResponse = {
    game_info: {
      game_id: string;
    };
    websocket_info: {
      auth_body: string;
      wss_link: string[];
    };
    anchor_info: {
      room_id: number;
      uname: string;
      uface: string;
      uid: number;
    };
  };

  export async function GameStart(body: GameStartRequest): Promise<GameStartResponse> {
    return api('/v2/app/start', body);
  }
}

// GameEnd
export namespace api {
  export type GameEndRequest = {
    game_id: string;
    app_id: number;
  };

  export type GameEndResponse = {};

  export async function GameEnd(body: GameEndRequest): Promise<GameEndResponse> {
    return api('/v2/app/end', body);
  }
}

// GameHeartbeat
export namespace api {
  export type GameHeartbeatRequest = {
    game_id: string;
  };

  export type GameHeartbeatResponse = {};

  export async function GameHeartbeat(body: GameHeartbeatRequest): Promise<GameHeartbeatResponse> {
    return api('/v2/app/heartbeat', body);
  }
}

// GameBatchHeartbeat
export namespace api {
  export type GameBatchHeartbeatRequest = {
    game_id: string;
  };

  export type GameBatchHeartbeatResponse = {};

  export async function GameBatchHeartbeat(body: GameBatchHeartbeatRequest): Promise<GameBatchHeartbeatResponse> {
    return api('/v2/app/batchHeartbeat', body);
  }
}
