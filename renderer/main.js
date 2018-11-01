'use strict';

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const qs = (selector, target) => (target || document).querySelector(selector);
const qsa = (selector, target) => (target || document).querySelectorAll(selector);
const getComponent = (n) => app.$children.find((c) => c.$options._componentTag == n);

const fs = require('fs');
const { getCurrentWindow, Menu, BrowserWindow } = require('electron').remote;
const Vue = require('./js/lib/Vue');
const contextMenu = require('./js/contextMenu');
const { users, settings } = require('./js/Storage');
const vkapi = require('./js/vkapi');

// Инициализация всех компонентов
require('./js/initComponents');

// статистика
vkapi('stats.trackVisitor');

let app = new Vue({
  el: '.app',
  data: {
    auth: !settings.get('activeID'),
    blocked: false,
    activeComponent: settings.get('section'),
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
