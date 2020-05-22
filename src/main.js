import { createApp } from 'vue';
import electron from 'electron';
import { debounce } from 'js/utils';
import store from 'js/store';
import router from 'js/router';
import getTranslate from 'js/getTranslate';
import shortcut from 'js/shortcut';

import App from './components/App.vue';
import ForwardedMessage from './components/messages/chat/attachments/ForwardedMessage.vue';

const app = createApp(App);

app.use(store);
app.use(router);

app.mixin({
  beforeCreate() {
    this.l = getTranslate;
  }
});

app.component('ForwardedMessage', ForwardedMessage);

app.mount('#app');

const win = electron.remote.getCurrentWindow();

shortcut(['Control+Shift+I', 'F12'], () => {
  if (win.isDevToolsOpened()) {
    win.closeDevTools();
  } else {
    win.openDevTools();
  }
});

window.addEventListener('resize', debounce(() => {
  store.commit('settings/setWindowBounds', win.getBounds());
}, 2000));
