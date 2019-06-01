import { remote as electron } from 'electron';
import { debounce } from 'js/utils';
import router from 'js/router';
import store from 'js/store/';
import Vue from 'vue';
import 'js/settingVue.js';

import App from './components/App.vue';

const win = electron.getCurrentWindow();
const { Menu } = electron;

const app = new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App)
});

document.addEventListener('contextmenu', (event) => {
  Menu.buildFromTemplate([
    {
      label: app.l('open_console'),
      click: win.openDevTools
    },
    {
      label: app.l('open_devtools'),
      click(temp, win) {
        win.inspectElement(event.x, event.y);
      }
    },
    {
      label: 'Dark mode',
      click: () => document.querySelector('body').setAttribute('scheme', document.querySelector('body').getAttribute('scheme') == 'dark' ? '' : 'dark')
    }
  ]).popup();
});

window.addEventListener('resize', debounce(() => {
  store.commit('settings/setWindowBounds', win.getBounds());
}, 2000));
