import { AndroidUserAgent, VKDesktopUserAgent, fields, toUrlParams } from 'js/utils';
import { openModal } from 'js/modals';
import vkapi, { version } from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
import request from 'js/request';

export function getAndroidToken(login, password, params = {}) {
  return new Promise(async (resolve) => {
    const query = toUrlParams({
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

    const { data } = await request(`https://oauth.vk.com/token?${query}`, {
      headers: {
        'User-Agent': AndroidUserAgent
      }
    }, {});

    if (data.trusted_hash) {
      store.commit('users/setTrustedHash', {
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
  const query = toUrlParams({
    redirect_uri: 'https://oauth.vk.com/blank.html',
    display: 'page',
    response_type: 'token',
    access_token: androidToken,
    lang: 'ru',
    scope: 136297695,
    client_id: 6717234,
    v: version,
    sdk_package: 'ru.danyadev.vkdesktop',
    sdk_fingerprint: '9E76F3AF885CD6A1E2378197D4E7DF1B2C17E46C'
  });

  const linkResponse = await request(`https://oauth.vk.com/authorize?${query}`, {
    headers: {
      'User-Agent': VKDesktopUserAgent
    }
  }, { raw: true });

  const link = 'https://oauth.vk.com' + linkResponse.headers.location;
  const { headers } = await request(link, { raw: true });

  return headers.location.match(/#access_token=([a-z0-9]{85})/)[1];
}

export async function loadUser(android_token, onlyAddUser) {
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

  store.commit('settings/setDefaultSettings', user.id);

  if (onlyAddUser) {
    router.back();
  } else {
    store.commit('users/setActiveUser', user.id);
  }
}
