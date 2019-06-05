import { VKDesktopUserAgent } from './utils';
import querystring from 'querystring';
import request from './request';
import store from './store/';
import { eventBus } from './utils';

export const version = '5.95';

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
    }, querystring.stringify(params));

    console.log(`[API] ${name} ${Date.now() - startTime}ms`);

    if(data.response !== undefined) resolve(data.response);
    else if(data.error.error_code == 14) {
      eventBus.emit('modal:open', 'captcha', {
        src: data.error.captcha_img,
        send(code) {
          params.captcha_sid = data.error.captcha_sid;
          params.captcha_key = code;

          if(name == 'captcha.force') methods.shift();

          reject();
        }
      });
    } else if(data.error.error_code == 5) {
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

      eventBus.emit('modal:open', 'blocked-account', id);

      methods.length = 0;
      reject();
    } else reject(data.error.error_code != 6 && data);
  });
}

const methods = [];
let inWork = false;

async function executeMethod() {
  const { data, resolve, reject } = methods[0];
  let shift = true;

  inWork = true;

  try {
    resolve(await vkapi(...data));
  } catch(err) {
    if(err) {
      console.warn('[VKAPI] error', err);
      reject(err);
    } else shift = false;
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
