'use strict';

const https = require('https');

module.exports = (url, data) => {
  return new Promise((resolve, reject) => {
    let req = https.request(url, (res) => {
      let buffers = [];

      res.on('data', (chunk) => buffers.push(chunk));
      res.on('end', () => resolve(String(Buffer.concat(buffers))));
      res.on('error', reject);
    });

    req.on('error', reject);

    if(typeof data == 'string' && typeof data.pipe == 'function') {
      data.pipe(req);
    } else req.end(data || '');
  });
}
