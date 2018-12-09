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
    let req = https.request(urlToObject(url), (res) => {
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
  return new Promise(async (resolve, reject) => {
    try {
      let data = await plainRequest(url, options);
      (newResolve || resolve)(JSON.parse(data));
    } catch(err) {
      console.warn(err);
      
      if(options.force) {
        setTimeout(() => request(url, options, newResolve || resolve), 1000 * 2);
      } else reject(err);
    }
  });
}

request.plain = plainRequest;

module.exports = request;
