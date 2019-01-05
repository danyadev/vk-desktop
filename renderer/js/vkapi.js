'use strict';

const querystring = require('querystring');
const API_VERSION = '5.92';

let methods = [], isCaptcha = false;

let addToQueue = (method, params, promise = {}) => {
  return new Promise((resolve, reject) => {
    promise.resolve = promise.resolve || resolve;
    promise.reject = promise.reject || reject;

    methods.push([method, params, promise]);
  });
}

setInterval(() => {
  if(methods[0] && !isCaptcha) {
    method(...methods[0]);
    methods.splice(0, 1);
  }
}, 380);

function getToken(params) {
  if(app.user && !params.access_token) {
    if(params.offToken) {
      params.access_token = app.user.other_token
    } else if(!params.access_token) {
      params.access_token = app.user.access_token;
    }
  }

  return params.access_token;
}

function tryResolve(params, data, resolve, reject) {
  if(params.access_token == getToken(params, params.offToken)) {
    delete params.offToken;
    if(resolve) resolve(data);
    else reject(data);
  }
}

let method = (name, params = {}, promise) => {
  return new Promise(async (resolve, reject) => {
    let time = Date.now();

    if(promise) {
      resolve = promise.resolve;
      reject = promise.reject;
    }

    params.v = params.v || API_VERSION;
    params.lang = app.$store.state.langName;
    params.access_token = getToken(params);

    let data = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: {
        'User-Agent': params.offToken ? 'VKAndroidApp/5.11.1-2316' : 'VKDesktop/' + process.package.version
      }
    }, { data: querystring.stringify(params) });

    if(data.response !== undefined) tryResolve(params, data.response, resolve);
    else {
      if(data.error.error_code == 5) {
        let error = data.error.error_msg.slice(27);

        switch(error) {
          case 'user revoke access for this token.':
          case 'invalid session.':
            app.$modals.open('blocked', 0);
            break;
          case 'user is deactivated.':
            app.$modals.open('blocked', 1);
            break;
          case 'invalid access_token (2).':
            app.$modals.open('blocked', 2);
            break;
        }
      } else if(data.error.error_code == 14) {
        isCaptcha = true;

        app.$modals.open('captcha', {
          src: data.error.captcha_img,
          send(code) {
            let newParams = Object.assign(params, {
              captcha_sid: data.error.captcha_sid,
              captcha_key: code
            });

            methods.unshift([name, newParams, promise || { resolve, reject }]);
            isCaptcha = false;
          }
        });
      } else tryResolve(params, data, null, reject);
    }

    if(params.log) {
      delete params.access_token;
      delete params.log;
      params.$method = name;

      let date = Date.now() - time + 'ms';
      console.log('[API]', date, Object.assign({}, data.response, { $options: params }));
    }
  });
}

addToQueue.upload = (url) => {
  // TODO: добавить загрузку различных документов
}

module.exports = addToQueue;
module.exports.version = API_VERSION;
