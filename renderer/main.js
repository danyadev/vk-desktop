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

// инициализируем компоненты
require('./js/components');

let app = new Vue({
  el: '.root',
  data: {
    auth: !settings.get('activeID')
  }
});

contextMenu.set(document.body, (e) => {
  return [{
    label: 'Открыть в DevTools',
    click: (temp, win) => win.inspectElement(e.x, e.y)
  }];
});

// Эвенты для тайтлбара
if(process.platform == 'darwin') {
  qs('.titlebar').classList.add('mac');

  qs('.titlebar_drag').addEventListener('dblclick', () => {
    if(getCurrentWindow().isFullScreen()) return;

    if(getCurrentWindow().isMaximized()) getCurrentWindow().emit('unmaximize');
    else getCurrentWindow().emit('maximize');
  });
}

getCurrentWindow().on('maximize', () => {
  qs('.titlebar').classList.add('maximized');
});

getCurrentWindow().on('unmaximize', () => {
  qs('.titlebar').classList.remove('maximized');
});

if(getCurrentWindow().isMaximized()) getCurrentWindow().emit('maximize');
else getCurrentWindow().emit('unmaximize');

['minimize', 'maximize', 'restore', 'close'].forEach((name) => {
  qs(`.titlebar_button.${name}`).addEventListener('click', () => getCurrentWindow()[name]());
});

window.addEventListener('beforeunload', () => {
  getCurrentWindow().removeAllListeners();

  BrowserWindow.getAllWindows().forEach((win) => {
    if(win != getCurrentWindow()) win.destroy();
  });

  settings.set('window', getCurrentWindow().getBounds());
});
