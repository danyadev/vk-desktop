'use strict';

const querystring = require('querystring');
const request = require('./request');

const API_VERSION = '5.92';

let methods = [],
    openedCaptcha = false;

let addToQueue = (method, params) => {
  return new Promise((resolve) => {
    methods.push({ method, params, resolve });
  });
}

setInterval(() => {
  if(methods[0] && !openedCaptcha) {
    method(methods[0].method, methods[0].params, methods[0].resolve);
    methods.splice(0, 1);
  }
}, 1000 / 3);

let method = (name, params, _resolve) => {
  return new Promise(async (resolve, reject) => {
    if(!other.isObject(params)) params = {};

    params.v = params.v || API_VERSION;
    params.access_token = params.access_token || (users.get() || {}).access_token;

    let data = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST'
    }, { data: querystring.stringify(params), force: true });

    if(data.response !== undefined) {
      (_resolve || resolve)(data.response);
    } else reject(data);

    if(params.log) {
      delete params.access_token;
      delete params.log;
      params.$method = name;

      console.log(Object.assign({}, data.response, { $options: params }));
    }

    // TODO: add captcha
  });
}

addToQueue.upload = (url) => {
  // TODO: добавить загрузку
}

module.exports = addToQueue;
