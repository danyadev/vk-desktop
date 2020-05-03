import { settingsStorage, defaultUserSettings } from '../Storage';
import ru from 'lang/ru';

const languages = {
  ru
};

export default {
  namespaced: true,

  state: settingsStorage.data,

  mutations: {
    setWindowBounds(state, bounds) {
      state.window = bounds;
    },

    setDefaultSettings(state, id) {
      state.userSettings[id] = defaultUserSettings;
    },

    updateUserSettings(state, settings) {
      state.userSettings[this.state.users.activeUser] = {
        ...this.getters['settings/settings'],
        ...settings
      };
    }
  },

  getters: {
    settings(state, getters, { users }) {
      return state.userSettings[users.activeUser];
    },

    lang({ langName }) {
      if (langName === 'ru') {
        return ru;
      }

      return {
        ...ru,
        ...languages[langName]
      };
    }
  }
};
