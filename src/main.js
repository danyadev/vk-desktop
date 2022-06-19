import os from 'os';
import electron from 'electron';
import { createApp } from 'vue';
import { debounce, currentWindow } from 'js/utils';
import { isModalOpened, openModal, closeModal } from 'js/modals';
import debug, { sendError } from 'js/debug';
import store from 'js/store';
import router from 'js/router';
import getTranslate from 'js/getTranslate';
import shortcut from 'js/shortcut';
import pkg from '../package.json';

import App from '@/App.vue';
import ForwardedMessage from '@/messages/chat/attachments/ForwardedMessage.vue';
import Attachments from '@/messages/chat/attachments/Attachments.vue';

import 'js/exposeFeatures';

electron.ipcRenderer.on('menu:preferences', () => {
  if (isModalOpened('settings')) {
    closeModal('settings');
  } else {
    openModal('settings');
  }
});

debug(
  '[init] ' +
  `os ${os.type()} (${os.platform()}) ${os.release()} ${os.arch()}; ` +
  `electron ${process.versions.electron}; ` +
  `app ${pkg.version}; ` +
  `user_id ${store.state.users.activeUserID || '(не авторизован)'}\n`
);

const app = createApp(App);

app.use(store);
app.use(router);

app.config.globalProperties.l = getTranslate;

if (!DEV_MODE) {
  app.config.erorHandler = sendError;
}

app.component('ForwardedMessage', ForwardedMessage);
app.component('Attachments', Attachments);

app.mount('body');

shortcut(['Control+Shift+I', 'F12'], () => {
  currentWindow.toggleDevTools();
});

window.addEventListener('resize', debounce(() => {
  store.commit('settings/setWindowBounds', currentWindow.getBounds());
}, 1000));
