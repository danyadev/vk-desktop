'use strict';

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
process.package = require('./../package');

const qs = (selector, target) => (target || document).querySelector(selector);
const qsa = (selector, target) => (target || document).querySelectorAll(selector);

const { getCurrentWindow, BrowserWindow } = require('electron').remote;
const Vue = require('./js/lib/Vue');
const Vuex = require('./js/lib/Vuex');
const utils = require('./js/utils');
const contextMenu = require('./js/contextMenu');
const emoji = require('./js/emoji');
const request = require('./js/request');
const vkapi = require('./js/vkapi');
const longpoll = require('./js/longpoll');

// настройка Vue
require('./js/initComponents');

let app = new Vue({
  el: '.app',
  store: require('./js/store/'),
  computed: {
    section() {
      return this.$store.state.settings.section;
    },
    user() {
      let { users, activeUser } = this.$store.state.settings;
      return users[activeUser];
    },
    auth() {
      return !this.user;
    }
  }
});

window.addEventListener('beforeunload', () => {
  getCurrentWindow().removeAllListeners();

  app.$store.commit('settings/setWindowBounds', getCurrentWindow().getBounds());

  BrowserWindow.getAllWindows().forEach((win) => {
    if(win != getCurrentWindow()) win.destroy();
  });
});
