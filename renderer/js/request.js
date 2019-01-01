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
      res.on('end', () => {
        resolve({
          text: String(Buffer.concat(buffers)),
          location: res.headers.location
        });
      });
      res.on('error', reject);
    });

    req.on('error', reject);

    if(other.isObject(options.data) && options.data.pipe instanceof Function) {
      options.data.pipe(req);
    } else req.end(options.data || '');
  });
};

let request = (url, options = {}, promise) => {
  return new Promise(async (resolve, reject) => {
    if(promise) {
      resolve = promise.resolve;
      reject = promise.reject;
    }

    try {
      let data = await plainRequest(url, options);

      try {
        data.text = JSON.parse(data.text);
      } catch(e) {}

      if(options.location) {
        resolve({
          text: data.text,
          location: data.location
        });
      } else resolve(data.text);
    } catch(err) {
      let connectErrors = ['getaddrinfo', 'read', 'connect'];

      if(connectErrors.includes(err.syscall)) {
        setTimeout(() => request(url, options, { resolve, reject }), 2500);
      } else reject(err);
    }
  });
}

module.exports = request;
