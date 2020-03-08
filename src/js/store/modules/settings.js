import Vue from 'vue';
import { settingsStorage, defaultUserSettings } from '../Storage';

function getLangFile(name) {
  const lang = require(`js/../lang/${name}.js`).default;

  if(name == 'ru') return lang;

  return Object.assign(getLangFile('ru'), lang);
}

export default {
  state: settingsStorage.data,

  mutations: {
    setWindowBounds(state, bounds) {
      state.window = bounds;
    },

    setDefaultUserSettings(state, id) {
      Vue.set(state.userSettings, id, defaultUserSettings);
    },

    updateUserSettings(state, { key, value }) {
      const id = this.state.users.activeUser;
      const data = { ...state.userSettings[id], [key]: value };

      Vue.set(state.userSettings, id, data);
    }
  },

  getters: {
    lang({ langName }) {
      return getLangFile(langName);
    },

    settings(state, getters, { users }) {
      return state.userSettings[users.activeUser];
    }
  }
}
