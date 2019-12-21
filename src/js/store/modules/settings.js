import Vue from 'vue';
import { settings, messagesDefaultSettings } from '../Storage';

function getLangFile(name) {
  const lang = require(`js/../lang/${name}.js`).default;

  if(name != 'ru') return Object.assign(getLangFile('ru'), lang);
  else return lang;
}

export default {
  state: settings.data,
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
