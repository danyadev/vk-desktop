import querystring from 'querystring';
import { AndroidUserAgent, VKDesktopUserAgent, fields } from 'js/utils';
import vkapi, { version } from 'js/vkapi';
import request from 'js/request';
import store from 'js/store';
import { openModal, closeModal } from 'js/modals';

export function getAndroidToken(login, password, params = {}) {
  return new Promise(async (resolve) => {
    const query = querystring.stringify({
      scope: 'all',
      client_id: 2274003,
      client_secret: 'hHbZxrka2uZ6jB1inYsH',
      username: login,
      password,
      '2fa_supported': 1,
      grant_type: 'password',
      lang: 'ru',
      v: version,
      trusted_hash: store.state.users.trustedHashes[login],
      ...params
    });

    const { data } = await request({
      host: 'oauth.vk.com',
      path: `/token?${query}`,
      headers: {
        'User-Agent': AndroidUserAgent
      }
    });

    if (data.trusted_hash) {
      store.commit('users/setTrusredHash', {
        login,
        hash: data.trusted_hash
      });
    }

    if (data.error === 'need_captcha') {
      openModal('captcha', {
        src: data.captcha_img,
        send(code) {
          resolve(
            getAndroidToken(login, password, {
              ...params,
              captcha_sid: data.captcha_sid,
              captcha_key: code
            })
          );
        }
      });
    } else if (data.ban_info) {
      resolve({ error: 'account_banned' });
    } else {
      resolve(data);
    }
  });
}

async function getDesktopToken(androidToken) {
  const query = querystring.stringify({
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
  });

  const { data } = await request({
    host: 'oauth.vk.com',
    path: `/authorize?${query}`,
    headers: {
      'User-Agent': VKDesktopUserAgent
    }
  }, { raw: true });

  // eslint-disable-next-line
  const link = 'https://oauth.vk.com' + data.match(/(\/auth_by_token.+?)"/)[1];
  const { headers } = await request(link, { raw: true });

  return headers.location.match(/#access_token=([a-z0-9]{85})/)[1];
}

export async function loadUser(android_token, isModal) {
  const access_token = await getDesktopToken(android_token);
  const [user] = await vkapi('users.get', {
    access_token,
    fields
  });

  store.commit('users/updateUser', {
    ...user,
    access_token,
    android_token
  });

  if (isModal) {
    closeModal('auth');
  } else {
    store.commit('users/setActiveUser', user.id);
  }
}
