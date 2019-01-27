'use strict';

const { EventEmitter } = require('events');

let Bus = new EventEmitter();

module.exports = {
  install(Vue) {
    Vue.prototype.$modals = {
      open(name, data) {
        Bus.emit('open', name, data);
      },
      close(name) {
        Bus.emit('close', name);
      }
    }
  },
  Bus
}
