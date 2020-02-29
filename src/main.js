import electron from 'electron';
import { debounce } from 'js/utils';
import shortcut from 'js/shortcut';
import router from 'js/router';
import store from 'js/store/';
import Vue from 'vue';

import 'js/settingVue.js';
import './css/light.css';
import './css/dark.css';

import App from './components/App.vue';
import Forwarded from './components/messages/chat/attachments/Forwarded.vue';
import ForwardedMessage from './components/messages/chat/attachments/ForwardedMessage.vue';

// Временный костыль для работы рекурсивных компонентов
Vue.component('Forwarded', Forwarded);
Vue.component('ForwardedMessage', ForwardedMessage);

const app = new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App)
});

const win = electron.remote.getCurrentWindow();

shortcut(['Control+Shift+I', 'F12'], () => {
  if(win.isDevToolsOpened()) win.closeDevTools();
  else win.openDevTools();
});

window.addEventListener('resize', debounce(() => {
  store.commit('settings/setWindowBounds', win.getBounds());
}, 2000));
