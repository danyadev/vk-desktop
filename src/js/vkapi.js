import { VKDesktopUserAgent } from './utils';
import querystring from 'querystring';
import request from './request';
import store from './store/';
import { eventBus } from './utils';

export const version = '5.113';

function vkapi(name, params) {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const user = store.getters['users/user'];

    params = Object.assign({
      access_token: user && user.access_token,
      lang: 'ru',
      v: version
    }, params);

    const { data } = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: { 'User-Agent': VKDesktopUserAgent }
    }, {
      postData: querystring.stringify(params)
    });

    const endTime = Date.now() - startTime;

    if(data.response !== undefined) {
      console.log(`[API] ${name} ${endTime}ms`);

      return resolve(data.response);
    }

    switch(data.error.error_code) {
      case 5: // Завершение сессии
        // Если был использован не свой токен
        if(!user || ![user.access_token, user.android_token].includes(params.access_token)) {
          return reject(data.error);
        }

        let id = 0;

        switch(data.error.error_msg.slice(27)) {
          case 'user revoke access for this token.':
          case 'invalid session.':
            id = 0;
            break;
          case 'user is deactivated.':
            id = 1;
            break;
          case 'invalid access_token (2).':
            id = 2;
            break;
        }

        eventBus.emit('modal:open', 'blocked-account', { id });
        break;

      case 6: // Много запросов в секунду
      case 9: // Flood control
        setTimeout(reject, 1000);
        break;

      case 10: // Internal Server Error
        eventBus.emit('modal:open', 'error-api', {
          method: name,
          error: data.error,
          retry: reject
        });
        break;

      case 14: // Captcha
        eventBus.emit('modal:open', 'captcha', {
          src: data.error.captcha_img,
          send(code) {
            params.captcha_sid = data.error.captcha_sid;
            params.captcha_key = code;

            if(name == 'captcha.force') resolve(1);
            else reject();
          }
        });
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

  inWork = true;

  try {
    resolve(await vkapi(...data));
  } catch(err) {
    if(err) reject(err);
    else shift = false;
  }

  if(shift) methods.shift();

  if(methods.length) executeMethod();
  else inWork = false;
}

export default function(...data) {
  return new Promise((resolve, reject) => {
    methods.push({ data, resolve, reject });

    if(methods.length == 1 && !inWork) executeMethod();
  });
}
