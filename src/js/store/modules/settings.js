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

    setDefaultUserSettings(state, id) {
      state.userSettings[id] = defaultUserSettings;
    },

    updateUserSettings(state, userSettings) {
      state.userSettings[this.state.users.activeUserID] = {
        ...state.userSettings[this.state.users.activeUserID],
        ...userSettings
      };
    },

    updateCommonSettings(state, commonSettings) {
      state.commonSettings = {
        ...state.commonSettings,
        ...commonSettings
      };
    }
  },

  getters: {
    settings(state, getters, { users }) {
      return {
        ...state.userSettings[users.activeUserID],
        ...state.commonSettings
      };
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
