import crypto from 'node:crypto';

const APP_KEY = process.env.BILI_ACCESS_KEY;
const APP_SECRET = process.env.BILI_ACCESS_SECRET;

function checkCredentials() {
  const pass = Boolean(APP_KEY) && Boolean(APP_SECRET);
  if (!pass) {
    throw new Error(`Failed to get \`access_key_id\` and \`access_key_secret\`, set them in .env file`);
  }
}

function md5(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function sha256(key: string, str: string) {
  return crypto.createHmac('sha256', key).update(str).digest('hex');
}

function signObject(obj: Record<string, string>) {
  const data: string[] = [];
  for (const key of Object.keys(obj)) {
    data.push(`${key}:${obj[key]}`);
  }

  const signature = sha256(APP_SECRET!, data.join('\n'));
  return signature;
}

export function getEncodeHeader(body: string) {
  checkCredentials();

  const timestamp = String(Math.ceil(Date.now() / 1000));
  const headers = {
    'x-bili-accesskeyid': APP_KEY!,
    'x-bili-content-md5': md5(body),
    'x-bili-signature-method': 'HMAC-SHA256',
    'x-bili-signature-nonce': crypto.randomUUID(),
    'x-bili-signature-version': '1.0',
    'x-bili-timestamp': timestamp,
  };

  const signature = signObject(headers);

  const res = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
    Authorization: signature,
  };
  return res;
}

export type H5AuthParams = {
  Timestamp: string;
  Code: string;
  Mid: string;
  Caller: string;
  CodeSign: string;
  Insecure?: string;
};

export type H5AuthResponse = {
  code: string;
  user_id: number;
} | null;

const isValidParams = (args: unknown[]): args is string[] => {
  return args.every((item) => typeof item === 'string');
};

export function authH5Params(params: H5AuthParams | NodeJS.Dict<string | string[]>): H5AuthResponse {
  const { Timestamp, Code, Mid, Caller, CodeSign, Insecure } = params as H5AuthParams;

  if (Insecure === '1' && Code) {
    return {
      code: Code?.toString(),
      user_id: 0,
    };
  }

  if (!isValidParams([Timestamp, Code, Mid, Caller, CodeSign])) {
    return null;
  }

  if (Caller !== 'bilibili') {
    return null;
  }

  const obj: Record<string, string> = {
    Caller,
    Code,
    Mid,
    Timestamp,
  };

  const sign = signObject(obj);
  if (CodeSign === sign) {
    return {
      code: Code,
      user_id: Number.parseInt(Mid, 10),
    };
  }

  return null;
}
