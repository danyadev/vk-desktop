'use strict';

const https = require('https');

let plainRequest = (url, options) => {
  if(!other.isObject(options)) options = {};

  return new Promise((resolve, reject) => {
    let req = https.request(url, (res) => {
      let buffers = [];

      res.on('data', (chunk) => buffers.push(chunk));
      res.on('end', () => resolve(String(Buffer.concat(buffers))));
      res.on('error', reject);
    });

    req.on('error', reject);

    if(options.data instanceof Object && typeof options.data.pipe == 'function') {
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
