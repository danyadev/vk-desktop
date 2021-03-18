import electron from 'electron';
import { VKDesktopUserAgent, AndroidUserAgent, toUrlParams } from './utils';
import { openModal } from './modals';
import store from './store';
import request from './request';
import debug from './debug';

export const version = '5.149';

let handleErrorPromise;
const clearHandleError = () => (handleErrorPromise = null);

function handleError({ user, params, error, ...context }) {
  debug(`[API error ${context.name}]`, JSON.stringify(error));

  return new Promise(async (resolve) => {
    // Сессия устарела
    if (error.error_code === 5) {
      // Был передан другой токен
      if (!user || ![user.access_token, user.android_token].includes(params.access_token)) {
        resolve();
        return context.reject(error);
      }

      const id = ({
        // Была принудительно завершена сессия
        'user revoke access for this token.': 0,
        // Закончилось время действия токена
        'invalid session.': 0,
        // Страница удалена
        'user is deactivated.': 1,
        // Страница заблокирована
        'invalid access_token (2).': 2
      })[error.error_msg.slice(27)];

      if (id === undefined) {
        context.reject(error);
        resolve();
      } else {
        openModal('blocked-account', { id });
      }

      return;
    }

    // Слишком много запросов в секунду / однотипных действий
    if (error.error_code === 6 || error.error_code === 9) {
      return setTimeout(() => {
        context.reject();
        resolve();
      }, 1000);
    }

    // Internal Server Error
    if (error.error_code === 10) {
      return openModal('error-api', {
        method: context.name,
        error,
        retry() {
          context.reject();
          resolve();
        }
      });
    }

    // Капча
    if (error.error_code === 14) {
      return openModal('captcha', {
        src: error.captcha_img,
        send(code) {
          if (context.name === 'captcha.force') {
            context.resolve(1);
            return resolve();
          }

          params.captcha_sid = error.captcha_sid;
          params.captcha_key = code;

          context.reject();
          resolve();
        }
      });
    }

    if (error.error_code === 17) {
      const redirectUri = error.redirect_uri;
      const { data: redirectPage } = await request(redirectUri, { raw: true });
      const goCaptchaLinkMatch = redirectPage.match(/<div class="fi_row"><a href="(.+?)" rel="noopener">/);

      // Это не ошибка подтверждения аккаунта, а запланированное действие,
      // доступное только по данной ссылке
      if (!goCaptchaLinkMatch) {
        // Когда будет нужно, можно переделать это в модальное окно электрона
        // и реализовать ожидание выхода из него, чтобы продолжить уже в клиенте.
        electron.shell.openExternal(redirectUri);

        context.resolve({
          type: 'redirect',
          link: redirectUri
        });

        return resolve();
      }

      const goCaptchaLink = 'https://m.vk.com' + goCaptchaLinkMatch[1];
      const { data: firstCaptchaPage } = await request(goCaptchaLink, { raw: true });
      let success = false;
      let captchaPage = firstCaptchaPage;

      while (!success) {
        const sendUrl = captchaPage.match(/<form action="(.+?)" method="post">/)[1];
        const captchaSid = captchaPage.match(/name="captcha_sid" value="(.+?)">/)[1];

        await new Promise((resume) => {
          openModal('captcha', {
            src: `https://m.vk.com/captcha.php?sid=${captchaSid}`,
            async send(code) {
              const res = await request({
                host: 'm.vk.com',
                path: sendUrl,
                method: 'POST'
              }, {
                raw: true,
                body: toUrlParams({
                  captcha_sid: captchaSid,
                  captcha_key: code
                })
              });

              if (res.statusCode === 302) {
                success = true;
                context.reject();
                resolve();
              } else {
                captchaPage = res.data;
              }

              resume();
            }
          });
        });
      }

      return;
    }

    context.reject(error);
    resolve();
  });
}

function vkapi(name, params, { android } = {}) {
  return new Promise(async (resolve, reject) => {
    const user = store.getters['users/user'];

    const startTime = Date.now();
    const debugParams = { ...params };
    delete debugParams.fields;
    debug(`[API request ${name}] ${JSON.stringify(debugParams)}`);

    params = {
      ...(user && { access_token: android ? user.android_token : user.access_token }),
      lang: 'ru',
      v: version,
      ...params
    };

    if (handleErrorPromise) {
      await handleErrorPromise;
    }

    const { data } = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: {
        'User-Agent': android ? AndroidUserAgent : VKDesktopUserAgent
      }
    }, {
      body: toUrlParams(params)
    });

    if (handleErrorPromise) {
      await handleErrorPromise;
    }

    if (data.execute_errors) {
      const [error] = data.execute_errors;
      handleErrorPromise = handleError({ name, params, error, user, resolve, reject });
      handleErrorPromise.then(clearHandleError);
      return;
    }

    debug(`[API request ${name}] ${Date.now() - startTime}ms`);

    if (data.response !== undefined) {
      return resolve(data.response);
    }

    handleErrorPromise = handleError({ name, params, error: data.error, user, resolve, reject });
    handleErrorPromise.then(clearHandleError);
  });
}

export default async function executeMethod(...data) {
  try {
    return await vkapi(...data);
  } catch (err) {
    if (err) {
      throw err;
    } else {
      return executeMethod(...data);
    }
  }
}
