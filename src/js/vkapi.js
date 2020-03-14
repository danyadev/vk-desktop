import querystring from 'querystring';
import { VKDesktopUserAgent, AndroidUserAgent } from './utils';
import request from './request';
import store from './store';

export const version = '5.118';

function vkapi(name, params, useAndroidToken) {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const user = store.getters['users/user'];

    params = {
      access_token: user && (useAndroidToken ? user.android_token : user.access_token),
      lang: 'ru',
      v: version,
      ...params
    };

    const { data } = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: {
        'User-Agent': useAndroidToken ? AndroidUserAgent : VKDesktopUserAgent
      }
    }, {
      postData: querystring.stringify(params)
    });

    const endTime = Date.now() - startTime;

    if (data.response !== undefined) {
      const logParams = { ...params };

      delete logParams.access_token;
      delete logParams.lang;
      delete logParams.v;
      delete logParams.fields;

      console.log(`[API] ${name} ${endTime}ms`, logParams);

      return resolve(data.response);
    }

    switch (data.error.error_code) {
      case 6: // Много запросов в секунду
      case 9: // Flood control
        setTimeout(reject, 1000);
        break;

      default: // Все остальные ошибки
        reject(data.error);
        break;
    }
  });
}

const methods = [];
let inWork = false;

async function executeMethod() {
  const [{ data, resolve, reject }] = methods;
  let shift = true;

  try {
    resolve(await vkapi(...data));
  } catch (err) {
    if (err) {
      reject(err);
    } else {
      // Для того, чтобы повторить запрос, я вызываю reject без ошибки
      // и отлавливаю его здесь, чтобы не удалять запрос из очереди.
      shift = false;
    }
  }

  if (shift) {
    methods.shift();
  }

  if (methods.length) {
    executeMethod();
  } else {
    inWork = false;
  }
}

export default function(...data) {
  return new Promise((resolve, reject) => {
    methods.push({ data, resolve, reject });

    if (!inWork) {
      inWork = true;
      executeMethod();
    }
  });
}
