import { createApp } from 'vue';
import { debounce, currentWindow } from 'js/utils';
import store from 'js/store';
import router from 'js/router';
import getTranslate from 'js/getTranslate';
import shortcut from 'js/shortcut';

import App from './components/App.vue';
import ForwardedMessage from './components/messages/chat/attachments/ForwardedMessage.vue';

const app = createApp(App);

app.use(store);
app.use(router);

app.config.globalProperties.l = getTranslate;

app.component('ForwardedMessage', ForwardedMessage);

app.mount('body');

shortcut(['Control+Shift+I', 'F12'], () => {
  if (currentWindow.isDevToolsOpened()) {
    currentWindow.closeDevTools();
  } else {
    currentWindow.openDevTools();
  }
});

window.addEventListener('resize', debounce(() => {
  store.commit('settings/setWindowBounds', currentWindow.getBounds());
}, 2000));
