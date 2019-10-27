import { remote as electron } from 'electron';
import { debounce } from 'js/utils';
import shortcut from 'js/shortcut';
import router from 'js/router';
import store from 'js/store/';
import Vue from 'vue';

import 'js/settingVue.js';
import 'js/updater.js';

import App from './components/App.vue';

const win = electron.getCurrentWindow();

const app = new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App)
});

shortcut(['Ctrl+Shift+I', 'F12'], () => {
  if(win.isDevToolsOpened()) win.closeDevTools();
  else win.openDevTools();
});

window.addEventListener('resize', debounce(() => {
  store.commit('settings/setWindowBounds', win.getBounds());
}, 2000));
