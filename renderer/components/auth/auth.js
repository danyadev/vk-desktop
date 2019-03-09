'use strict';

const querystring = require('querystring');

async function refreshToken() {
  const { token } = await vkapi('auth.refreshToken', {
    offToken: true,
    receipt: 'JSv5FBbXbY:APA91bF2K9B0eh61f2WaTZvm62GOHon3-vElmVq54ZOL5PHpFkIc85WQUxUH_wae8YEUKkEzLCcUC5V4bTWNNPbjTxgZRvQ-PLONDMZWo_6hwiqhlMM7gIZHM2K2KhvX-9oCcyD1ERw4'
  });

  return token;
}

function getAndroidToken(login, password, params = {}) {
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
        lang: app.$store.state.langName,
        v: vkapi.version,
        ...params
      }),
      headers: { 'User-Agent': 'VKAndroidApp/5.11.1-2316' }
    });

    const errors = ['invalid_client', 'invalid_request', 'need_validation'];

    if(data.ban_info) {
      let { member_name, message } = data.ban_info;

      app.$toast(`${member_name}, ${message}`);
      resolve({ error: 'invalid_client' });
    } else if(data.error == 'need_captcha') {
      app.$modals.open('captcha', {
        src: data.captcha_img,
        send(code) {
          getAndroidToken(login, password, Object.assign(params, {
            captcha_sid: data.captcha_sid,
            captcha_key: code
          })).then(resolve);
        }
      });
    } else if(errors.includes(data.error)) resolve(data);
    else resolve({ token: data.access_token });
  });
}

async function getDesktopToken(androidToken) {
  const reqParams = {
    host: 'oauth.vk.com',
    path: '/authorize?' + querystring.stringify({
      redirect_uri: 'https://oauth.vk.com/blank.html',
      display: 'page',
      response_type: 'token',
      access_token: androidToken,
      revoke: 1,
      lang: app.$store.state.langName,
      scope: 136297695,
      client_id: 6717234,
      sdk_package: 'com.danyadev.vkdesktop',
      sdk_fingerprint: 'A6SF876A8SF7A78G58ADHG89AGAG9'
    }),
    headers: { 'User-Agent': 'VKDesktop/' + process.package.version }
  };

  let { data: site } = await request(reqParams),
      link = 'https://oauth.vk.com' + site.match(/\/auth_by_token?.+=\w+/)[0],
      { headers: { location } } = await request(link),
      desktopToken = location.match(/#access_token=([A-z0-9]{85})/)[1];

  return desktopToken;
}

async function getSupportToken(androidToken) {
  const reqParams = {
    host: 'oauth.vk.com',
    path: '/authorize?' + querystring.stringify({
      redirect_uri: 'https://oauth.vk.com/blank.html',
      display: 'page',
      response_type: 'token',
      access_token: androidToken,
      source_url: 'https://static.vk.com/support/#/support',
      revoke: 1,
      lang: app.$store.state.langName,
      scope: 'support,offline',
      client_id: 6126832
    }),
    headers: { 'User-Agent': 'VKAndroidApp/5.11.1-2316' }
  };


  let { headers: { location: link } } = await request(reqParams),
      { headers: { location } } = await request('https://oauth.vk.com' + link),
      supportToken = location.match(/#access_token=([A-z0-9]{85})/)[1];

  return supportToken;
}

module.exports = {
  refreshToken,
  getAndroidToken,
  getDesktopToken,
  getSupportToken
}
