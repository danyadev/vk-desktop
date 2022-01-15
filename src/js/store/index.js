import { createStore } from 'vuex';
import { usersStorage, settingsStorage, mainSettingsStorage } from './Storage';

import rootModule from './modules';
import messages from './modules/messages';
import settings from './modules/settings';
import mainSettings from './modules/mainSettings';
import users from './modules/users';

const store = createStore({
  ...rootModule,
  modules: {
    messages,
    settings,
    mainSettings,
    users
  }
});

store.subscribe(({ type }, state) => {
  if (type.startsWith('users/')) {
    usersStorage.update(state.users);
  }

  else if (type.startsWith('settings/')) {
    settingsStorage.update(state.settings);
  }

  else if (type.startsWith('mainSettings/')) {
    mainSettingsStorage.update(state.mainSettings);
  }
});

export default store;
