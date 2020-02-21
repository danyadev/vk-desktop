import querystring from 'querystring';
import { AndroidUserAgent, VKDesktopUserAgent } from 'js/utils';
import { version } from 'js/vkapi';
import request from 'js/request';
import { eventBus } from 'js/utils';
import store from 'js/store/';

export function getAndroidToken(login, password, params = {}) {
  return new Promise(async (resolve) => {
    const { data } = await request({
      host: 'oauth.vk.com',
      path: '/token?' + querystring.stringify({
        scope: 'all',
        client_id: 2274003,
        client_secret: 'hHbZxrka2uZ6jB1inYsH',
        username: login,
        password: password,
        '2fa_supported': 1,
        grant_type: 'password',
        lang: 'ru',
        v: version,
        trusted_hash: store.state.users.trustedHashes[login],
        ...params
      }),
      headers: { 'User-Agent': AndroidUserAgent }
    });

    if(data.trusted_hash) {
      store.commit('users/setTrusredHash', {
        login: login,
        hash: data.trusted_hash
      });
    }

    if(data.error == 'need_captcha') {
      eventBus.emit('modal:open', 'captcha', {
        src: data.captcha_img,
        send(code) {
          getAndroidToken(login, password, Object.assign(params, {
            captcha_sid: data.captcha_sid,
            captcha_key: code
          })).then(resolve);
        }
      });
    } else if(data.ban_info) {
      resolve({ error: 'account_banned' });
    } else resolve(data);
  });
}

export async function getDesktopToken(androidToken) {
  const { data } = await request({
    host: 'oauth.vk.com',
    path: '/authorize?' + querystring.stringify({
      redirect_uri: 'https://oauth.vk.com/blank.html',
      display: 'page',
      response_type: 'token',
      access_token: androidToken,
      revoke: 1,
      lang: 'ru',
      scope: 136297695,
      client_id: 6717234,
      v: version,
      sdk_package: 'ru.danyadev.vkdesktop',
      sdk_fingerprint: '9E76F3AF885CD6A1E2378197D4E7DF1B2C17E46C'
    }),
    headers: { 'User-Agent': VKDesktopUserAgent }
  });

  const link = 'https://oauth.vk.com' + data.match(/(\/auth_by_token.+?)"/)[1];
  const { headers } = await request(link);

  return headers.location.match(/#access_token=([a-z0-9]{85})/)[1];
}
