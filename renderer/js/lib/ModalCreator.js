'use strict';

const { EventEmitter } = require('events');

let Bus = new EventEmitter();

let ModalCreator = {
  install(Vue) {
    Vue.prototype.$modals = new Vue({
      name: '$modals',
      created() {
        this.$on('open', (name) => this.open(name));
        this.$on('close', (data) => this.close(data));
      },
      methods: {
        open(name, data) {
          Bus.emit('open', name, data);
        },
        close(name) {
          Bus.emit('close', name);
        }
      }
    });
  },
  Bus
}

module.exports = ModalCreator;
