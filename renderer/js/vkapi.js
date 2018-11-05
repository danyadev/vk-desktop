'use strict';

const querystring = require('querystring');
const request = require('./request');

const API_VERSION = '5.87';

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
    params = params || {};
    params.v = params.v || API_VERSION;
    params.access_token = params.access_token || (users.get() || {}).access_token;

    let data = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST'
    }, querystring.stringify(params));

    let resp = JSON.parse(data);

    if(resp.response !== undefined) {
      (_resolve || resolve)(resp.response);
    } else reject(resp);

    if(params.log) {
      delete params.access_token;
      delete params.log;
      params.$method = name;

      console.log(Object.assign(resp.response, { $options: params }));
    }

    // TODO: add captcha
  });
}

module.exports = addToQueue;
