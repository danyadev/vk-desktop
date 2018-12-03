'use strict';

const https = require('https');
const URL = require('url');

let urlToObject = (url) => {
  if(other.isObject(url)) return url;
  let data = URL.parse(url);

  return {
    host: data.host,
    path: data.path
  }
}

let plainRequest = (url, options) => {
  if(!other.isObject(options)) options = {};

  return new Promise((resolve, reject) => {
    let data = Object.assign(urlToObject(url), {
      agent: new https.Agent({ timeout: 5000 })
    });

    let req = https.request(data, (res) => {
      let buffers = [];

      res.on('data', (chunk) => buffers.push(chunk));
      res.on('end', () => resolve(String(Buffer.concat(buffers))));
      res.on('error', reject);
    });

    req.on('error', reject);

    if(other.isObject(options.data) && options.data.pipe instanceof Function) {
      options.data.pipe(req);
    } else req.end(options.data || '');
  });
};

let request = (url, options = {}, newResolve) => {
  return new Promise((resolve, reject) => {
    plainRequest(url, options).then((data) => {
      (newResolve || resolve)(JSON.parse(data));
    }).catch((err) => {
      if(options.force) {
        setTimeout(() => request(url, options, newResolve || resolve), 1000 * 2);
      } else reject(err);
    });
  });
}

request.plain = plainRequest;

module.exports = request;
