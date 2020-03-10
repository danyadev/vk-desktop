import Vue from 'vue';
import { settingsStorage, messagesDefaultSettings } from '../Storage';
import { onTransitionEnd } from 'js/utils';

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

    updateUserSettings(state, settings) {
      const id = this.state.users.activeUser;
      const data = { ...state.userSettings[id], ...settings };

      Vue.set(state.userSettings, id, data);
    }
  },

  actions: {
    async toggleTheme({ state, rootState }) {
      rootState.isThemeChange = true;
      await Vue.nextTick();
      state.darkTheme = !state.darkTheme;
      await onTransitionEnd(document.body, true);
      rootState.isThemeChange = false;
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
