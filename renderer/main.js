'use strict';

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const qs = (selector, target) => (target || document).querySelector(selector);
const qsa = (selector, target) => (target || document).querySelectorAll(selector);

const fs = require('fs');
const { getCurrentWindow, Menu, BrowserWindow } = require('electron').remote;
const Vue = require('./js/lib/Vue');
const Vuex = require('./js/lib/Vuex');
const other = require('./js/other');
const { random, endScroll, escape } = other;
const contextMenu = require('./js/contextMenu');
const emoji = require('./js/emoji');
const { users, settings } = require('./js/Storage');
const vkapi = require('./js/vkapi');

// настройка Vue
Vue.config.devtools = true;
require('./js/initComponents');

Vue.directive('emoji', (el, { modifiers }, vnode) => {
  let html = vnode.children[0].text;

  if(!modifiers.br) html = html.replace(/<br>/g, ' ');
  if(modifiers.push) html = html.replace(other.regexp.push, '$3');
  html = emoji(html);

  el.innerHTML = html;
});

let app = new Vue({
  el: '.app',
  store: require('./js/VueStore.js'),
  data: {
    auth: !settings.get('activeID'),
    blocked: false,
    section: settings.get('section'),
    activeMenu: false
  },
  methods: {
    closeMenu(e) {
      if(!e || e.target == qs('.content')) this.activeMenu = false;
    }
  }
});

contextMenu.set(document.body, (e) => {
  return [{
    label: 'Открыть в DevTools',
    click: (temp, win) => win.inspectElement(e.x, e.y)
  }];
});

window.addEventListener('beforeunload', () => {
  getCurrentWindow().removeAllListeners();

  BrowserWindow.getAllWindows().forEach((win) => {
    if(win != getCurrentWindow()) win.destroy();
  });

  settings.set('window', getCurrentWindow().getBounds());
});
