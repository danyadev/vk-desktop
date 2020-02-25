import { VKDesktopUserAgent, AndroidUserAgent } from './utils';
import querystring from 'querystring';
import request from './request';
import store from './store/';
import { eventBus } from './utils';

export const version = '5.118';

function vkapi(name, params, useAndroidToken) {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const user = store.getters['users/user'];

    params = Object.assign({
      access_token: user && (useAndroidToken ? user.android_token : user.access_token),
      lang: 'ru',
      v: version
    }, params);

    const { data } = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: { 'User-Agent': useAndroidToken ? AndroidUserAgent : VKDesktopUserAgent }
    }, {
      postData: querystring.stringify(params)
    });

    const endTime = Date.now() - startTime;

    if(data.response !== undefined) {
      const logParams = Object.assign({}, params);

      delete logParams.access_token;
      delete logParams.lang;
      delete logParams.v;
      delete logParams.fields;

      console.log(`[API] ${name} ${endTime}ms`, logParams);

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
            if(name == 'captcha.force') return resolve(1);

            params.captcha_sid = data.error.captcha_sid;
            params.captcha_key = code;

            reject();
          }
        });
        break;

      case 17: // Необходима активация аккаунта (добавить номер телефона)
        const { data: redirectPage } = await request(data.error.redirect_uri);
        const goCaptchaLink = 'https://m.vk.com' + redirectPage.match(/<div class="fi_row"><a href="(.+?)" rel="noopener">/)[1];
        const { data: firstCaptchaPage } = await request(goCaptchaLink);
        let success = false;
        let captchaPage = firstCaptchaPage;

        while(!success) {
          const sendUrl = captchaPage.match(/<form action="(.+?)" method="post">/)[1];
          const captchaSid = captchaPage.match(/name="captcha_sid" value="(.+?)">/)[1];

          await new Promise((resolve) => {
            eventBus.emit('modal:open', 'captcha', {
              src: `https://m.vk.com/captcha.php?sid=${captchaSid}`,
              async send(code) {
                const res = await request({
                  host: 'm.vk.com',
                	path: sendUrl,
                	method: 'POST'
                }, {
                  postData: querystring.stringify({
                		captcha_sid: captchaSid,
                		captcha_key: code
                  })
                });

                if(res.statusCode == 302) {
                  success = true;
                  // Режект в основной функции для повтора вызова метода
                  reject();
                } else {
                  captchaPage = res.data;
                }

                resolve();
              }
            });
          });
        }
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
