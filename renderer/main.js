'use strict';

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
process.package = require('./../package');

const qs = (selector, target) => (target || document).querySelector(selector);
const qsa = (selector, target) => (target || document).querySelectorAll(selector);

const { getCurrentWindow, BrowserWindow } = require('electron').remote;
const Vue = require('./js/lib/Vue');
const Vuex = require('./js/lib/Vuex');
const other = require('./js/other');
const contextMenu = require('./js/contextMenu');
const emoji = require('./js/emoji');
const { users, settings } = require('./js/Storage');
const request = require('./js/request');
const vkapi = require('./js/vkapi');

// настройка Vue
Vue.config.devtools = true;
require('./js/initComponents');

let app = new Vue({
  el: '.app',
  store: require('./js/VueStore'),
  data: {
    section: settings.get('section')
  },
  computed: {
    auth() {
      return !this.$store.state.activeUser;
    },
    user() {
      return this.$store.state.users[this.$store.state.activeUser];
    }
  }
});

window.addEventListener('beforeunload', () => {
  getCurrentWindow().removeAllListeners();

  BrowserWindow.getAllWindows().forEach((win) => {
    if(win != getCurrentWindow()) win.destroy();
  });

  settings.set('window', getCurrentWindow().getBounds());
});
