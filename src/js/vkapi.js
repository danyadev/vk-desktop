import electron from 'electron';
import { VKDesktopUserAgent, AndroidUserAgent, toUrlParams } from './utils';
import { openModal } from './modals';
import store from './store';
import request from './request';

export const version = '5.132';

const errorHandlers = {};

function addErrorHandler(code, fn) {
  errorHandlers[code] = fn;
}

// Сессия устарела
addErrorHandler(5, ({ params, error, user, reject }) => {
  // Был передан другой токен
  if (!user || ![user.access_token, user.android_token].includes(params.access_token)) {
    return reject(error);
  }

  let id;

  switch (error.error_msg.slice(27)) {
    // Была принудительно завершена сессия
    case 'user revoke access for this token.':
    // Закончилось время действия токена
    case 'invalid session.':
      id = 0;
      break;

    // Страница удалена
    case 'user is deactivated.':
      id = 1;
      break;

    // Страница заблокирована
    case 'invalid access_token (2).':
      id = 2;
      break;

    default:
      return reject(error);
  }

  openModal('blocked-account', { id });
});

// Много запросов в секунду
addErrorHandler(6, ({ reject }) => {
  setTimeout(reject, 1000);
});

// Flood control
addErrorHandler(9, ({ reject }) => {
  setTimeout(reject, 1000);
});

// Internal Server Error
addErrorHandler(10, ({ name, error, reject }) => {
  openModal('error-api', {
    method: name,
    error,
    retry: reject
  });
});

// Капча
addErrorHandler(14, ({ name, params, error, resolve, reject }) => {
  openModal('captcha', {
    src: error.captcha_img,
    send(code) {
      if (name === 'captcha.force') {
        return resolve(1);
      }

      params.captcha_sid = error.captcha_sid;
      params.captcha_key = code;

      reject();
    }
  });
});

addErrorHandler(17, async ({ error, resolve, reject }) => {
  const redirectUri = error.redirect_uri;
  const { data: redirectPage } = await request(redirectUri, { raw: true });
  const goCaptchaLinkMatch = redirectPage.match(/<div class="fi_row"><a href="(.+?)" rel="noopener">/);

  // Это не ошибка подтверждения аккаунта, а запланированное действие,
  // доступное только по данной ссылке
  if (!goCaptchaLinkMatch) {
    // Когда будет нужно, можно переделать это в модальное окно электрона
    // и реализовать ожидание выхода из него, чтобы продолжить уже в клиенте.
    electron.shell.openItem(redirectUri);

    return resolve({
      type: 'redirect',
      link: redirectUri
    });
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
            // Повторяем вызов метода
            reject();
          } else {
            captchaPage = res.data;
          }

          resume();
        }
      });
    });
  }
});

function vkapi(name, params, { android, vkme } = {}) {
  return new Promise(async (resolve, reject) => {
    const user = store.getters['users/user'];

    // console.log('[API]', name, Object.assign({}, params, { fields: '' }));

    params = {
      access_token: user && (android ? user.android_token : user.access_token),
      lang: 'ru',
      v: version,
      ...params
    };

    const { data } = await request({
      host: vkme ? 'api.vk.me' : 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: {
        'User-Agent': android ? AndroidUserAgent : VKDesktopUserAgent
      }
    }, {
      body: toUrlParams(params)
    });

    if (data.execute_errors) {
      console.warn('[vkapi] error', data.execute_errors);

      let hasHandler = false;

      for (const error of data.execute_errors) {
        const errorHandler = errorHandlers[data.error_code];

        if (errorHandler) {
          errorHandler({ name, params, error, user, resolve, reject });
          hasHandler = true;
          break;
        }
      }

      if (!hasHandler) {
        reject(data);
      }
    }

    if (data.response !== undefined) {
      return resolve(data.response);
    }

    console.warn('[vkapi] error', data.error);

    const errorHandler = errorHandlers[data.error.error_code];

    if (errorHandler) {
      errorHandler({ name, params, error: data.error, user, resolve, reject });
    } else {
      reject(data.error);
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
      // Если вызвать reject без параметров, то этот метод не будет
      // удален из очереди и вызов метода повторится
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
