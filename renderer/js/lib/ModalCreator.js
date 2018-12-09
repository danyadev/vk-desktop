/**
 * ModalCreator
 * (c) 2018 danyadev
 * @license Apache-2.0
 */
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
        open(name) {
          Bus.emit('open', name);
        },
        close(data) {
          Bus.emit('close', data);
        }
      }
    });

    Vue.mixin({
      created() {
        this.$on('modals:open', (name) => {
          Bus.emit('open', name);
        });

        this.$on('modals:close', (data) => {
          Bus.emit('close', data);
        });
      }
    });
  },
  Bus
}

module.exports = ModalCreator;
