import Vue from 'vue';
import { settingsStorage, messagesDefaultSettings } from '../Storage';

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

    setDefaultMessagesSettings(state, id) {
      Vue.set(state.userSettings, id, messagesDefaultSettings);
    },

    updateMessagesSettings(state, { key, value }) {
      const id = this.state.users.activeUser;
      const data = { ...state.userSettings[id], [key]: value };

      Vue.set(state.userSettings, id, data);
    },

    toggleTheme(state) {
      state.theme = state.theme == 'light' ? 'dark' : 'light';
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
