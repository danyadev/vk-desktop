import Vue from 'vue';
import { settings } from '../Storage';

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
    updateMessagesSettings(state, { key, value }) {
      Vue.set(state.messagesSettings, key, value);
    }
  },
  getters: {
    lang({ langName }) {
      return getLangFile(langName);
    }
  }
}
