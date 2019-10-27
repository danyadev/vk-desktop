'use strict';

const ipc = require('electron').ipcMain;

const CALL = 0;
const REPLY = 1;

function createCallablePromise(abortCallback) {
  let resolve, reject;

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  promise.resolve = (result) => resolve(result);
  promise.reject = (result) => reject(result);
  promise.abort = abortCallback;

  return promise;
}

class IPCMainBridge {
  constructor() {
    this.counter = 0;
    this.promises = {};
    this.win = null;
    this.key = 'updater_worker';

    ipc.on(this.key, this.listener.bind(this));
  }

  setWindow(win) {
    this.win = win;
  }

  call(payload) {
    const num = this.nextNumber();

    this.promises[num] = createCallablePromise(() => {
      if(this.promises[num]) {
        delete this.promises[num];
      }
    });

    this.dispatch(num, payload);

    return this.promises[num];
  }

  listener(event, message) {
    if(message[0] == REPLY) {
      const num = message[1];

      if(this.promises[num]) {
        this.promises[num].resolve(message[2]);
        delete this.promises[num];
      }
    }
  }

  dispatch(num, payload) {
    this.win.webContents.send(this.key, [CALL, num, payload]);
  }

  nextNumber() {
    this.counter++;

    if(this.counter > 65536) this.counter = 0;

    return this.counter;
  }
}

module.exports = IPCMainBridge;
