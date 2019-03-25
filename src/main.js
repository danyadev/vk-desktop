import { remote as electron } from 'electron';
import { debounce } from 'js/utils';
import router from 'js/router';
import store from 'js/store/';
import Vue from 'vue';
import 'js/settingVue.js';

import App from './components/App.vue';

const win = electron.getCurrentWindow();
const { Menu } = electron;

let app = new Vue({
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
      label: app.l('open_in_devtools'),
      click(temp, win) {
        win.inspectElement(event.x, event.y);
      }
    }
  ]).popup();
});

window.addEventListener('resize', debounce(() => {
  app.$store.commit('settings/setWindowBounds', win.getBounds());
}, 2000));
