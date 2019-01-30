'use strict';

const https = require('https');
const URL = require('url');
const dns = require('dns');
const { EventEmitter } = require('events');

class ConnectChecker extends EventEmitter {
  constructor() {
    super();

    this.isConnected = true;
    this.check();
  }

  check() {
    return new Promise((resolve) => {
      dns.lookup('google.com', (err) => {
        if(err && this.isConnected) {
          this.interval = setInterval(() => this.check(), 2000);
        } else if(!err && !this.isConnected) {
          clearInterval(this.interval);
          this.emit('restored');
        }

        this.isConnected = !err;
        resolve(this.isConnected);
      });
    });
  }
}

let connectChecker = new ConnectChecker(),
    requests = [];

connectChecker.on('restored', () => {
  for(let req of requests) request(...req);
  requests = [];
});

function request(url, postData = '', promise) {
  return new Promise((resolve, reject) => {
    if(promise) {
      resolve = promise.resolve;
      reject = promise.reject;
    }

    let req = https.request(url, (res) => {
      let chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        let data = String(Buffer.concat(chunks));

        try {
          data = JSON.parse(data);
        } catch(e) {}

        resolve({ data, headers: res.headers });
      });
    });

    req.on('error', () => {
      connectChecker.check();
      requests.push([url, postData, { resolve, reject }]);
    });

    req.end(postData);
  });
}

module.exports = request;
