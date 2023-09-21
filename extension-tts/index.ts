import 'dotenv/config';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { PassThrough, type Stream } from 'node:stream';
import { type FileHandle, writeFile } from 'node:fs/promises';
import { type PathLike } from 'node:fs';

export type SynthesizerConfig = {
  file?: string;
  voice?: string;

  speech_key?: string;
  speech_region?: string;
};

export const voicePreset = {
  wuu: {
    xiaotongM: 'wuu-CN-XiaotongNeural',
    yunzheF: 'wuu-CN-YunzheNeural',
  },
  yue: {
    xiaominF: 'yue-CN-XiaoMinNeural',
    yunsongM: 'yue-CN-YunSongNeural',
  },
  zh: {
    xiaoxiaoF: 'zh-CN-XiaoxiaoNeural',
    yunxiM: 'zh-CN-YunxiNeural',
    yunjianM: 'zh-CN-YunjianNeural',
    xiaoyiF: 'zh-CN-XiaoyiNeural',
    yunyangM: 'zh-CN-YunyangNeural',
    xiaochenF: 'zh-CN-XiaochenNeural',
    xiaohanF: 'zh-CN-XiaohanNeural',
    xiaomengF: 'zh-CN-XiaomengNeural',
    xiaomoF: 'zh-CN-XiaomoNeural',
    xiaoqiuF: 'zh-CN-XiaoqiuNeural',
    xiaoruiF: 'zh-CN-XiaoruiNeural',
    xiaoshuangFC: 'zh-CN-XiaoshuangNeural',
    xiaoxuanF: 'zh-CN-XiaoxuanNeural',
    xiaoyanF: 'zh-CN-XiaoyanNeural',
    xiaoyouFC: 'zh-CN-XiaoyouNeural',
    xiaozhenF: 'zh-CN-XiaozhenNeural',
    yunfengM: 'zh-CN-YunfengNeural',
    yunhaoM: 'zh-CN-YunhaoNeural',
    yunxiaM: 'zh-CN-YunxiaNeural',
    yunyeM: 'zh-CN-YunyeNeural',
    yunzeM: 'zh-CN-YunzeNeural',
  },
  henan: {
    yundengM: 'zh-CN-henan-YundengNeural',
  },
  liaoning: {
    xiaobeiF: 'zh-CN-liaoning-XiaobeiNeural',
  },
  shaanxi: {
    xiaoniF: 'zh-CN-shaanxi-XiaoniNeural',
  },
  shandong: {
    yunxiangM: 'zh-CN-shandong-YunxiangNeural',
  },
  sichuan: {
    yunxiM: 'zh-CN-sichuan-YunxiNeural',
  },
  hk: {
    hiumaanF: 'zh-HK-HiuMaanNeural',
    wanlungM: 'zh-HK-WanLungNeural',
    hiugaaiF: 'zh-HK-HiuGaaiNeural',
  },
  tw: {
    hsiaochenF: 'zh-TW-HsiaoChenNeural',
    yunjheM: 'zh-TW-YunJheNeural',
    hsiaoyuF: 'zh-TW-HsiaoYuNeural',
  },
};

async function timeout(ts: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('request timeout'));
    }, ts);
  });
}

export type SynthesisResult = {
  asFile(filename: PathLike | FileHandle): Promise<void>;
  asStream(): Stream;
} & sdk.SpeechSynthesisResult;

export class Synthesizer {
  static createResult(result: sdk.SpeechSynthesisResult): SynthesisResult {
    const ret = result as SynthesisResult;
    ret.asFile = async (filename) => {
      const bufferStream = new PassThrough();
      bufferStream.end(Buffer.from(result.audioData));
      return writeFile(filename, bufferStream);
    };

    ret.asStream = () => {
      const bufferStream = new PassThrough();
      bufferStream.end(Buffer.from(result.audioData));
      return bufferStream;
    };

    return ret;
  }

  timeout = 8000;

  #synthesizer: sdk.SpeechSynthesizer;
  constructor(props: SynthesizerConfig = {}) {
    const { SPEECH_KEY, SPEECH_REGION } = process.env;
    const { file, voice, speech_key = SPEECH_KEY, speech_region = SPEECH_REGION } = props;
    if (!speech_key || !speech_region) {
      throw new Error(`set \`SPEECH_KEY\` and \`SPEECH_REGION\` in your \`.env\` file`);
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(speech_key, speech_region);
    const audioConfig = file ? sdk.AudioConfig.fromAudioFileOutput(file) : undefined;
    speechConfig.speechSynthesisVoiceName = voice ? voice : 'zh-CN-XiaoshuangNeural';

    this.#synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
  }

  get synthesizer() {
    return this.#synthesizer;
  }

  done() {
    this.#synthesizer.close();
    this.#synthesizer = null!;
  }

  async speak(text?: string | undefined, ssml?: string | undefined) {
    const synthesizer = this.#synthesizer;
    let data: string;
    let fn: typeof synthesizer.speakTextAsync | typeof synthesizer.speakSsmlAsync;
    if (text) {
      data = text;
      fn = synthesizer.speakTextAsync.bind(synthesizer);
    } else if (ssml) {
      data = ssml;
      fn = synthesizer.speakSsmlAsync.bind(synthesizer);
    }

    return new Promise<SynthesisResult>((resolve, reject) => {
      void timeout(this.timeout).catch(reject);
      fn(
        data,
        (result) => {
          if (result.audioData) {
            resolve(Synthesizer.createResult(result));
          } else {
            reject(new Error(result.errorDetails));
          }
        },
        (reason) => {
          reject(new Error(reason));
        },
      );
    });
  }

  async speakText(text: string) {
    return this.speak(text);
  }

  async speakSsml(ssml: string) {
    return this.speak(undefined, ssml);
  }
}
