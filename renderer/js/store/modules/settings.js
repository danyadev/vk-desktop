'use strict';

const settings = require('./../Storage');

function getLangFile(name) {
  let lang = require(`./../../../lang/${name}.js`);

  if(name != 'ru') return Object.assign(getLangFile('ru'), lang);
  else return lang;
}

module.exports = {
  state: settings.data,
  actions: {
    clear({ state }) {
      settings.update(settings.defaults);
      state = Object.assign({}, settings.data);
    }
  },
  mutations: {
    setWindowBounds(state, bounds) {
      state.window = bounds;
    },
    setLang(state, name) {
      state.lang = name;
    },
    updateUser(state, data) {
      let user = state.users[data.id],
          newUser = Object.assign({}, user, data);

      Vue.set(state.users, data.id, newUser);
    },
    removeUser(state, id) {
      Vue.delete(state.users, id);
    },
    setActiveUser(state, id) {
      state.activeUser = id;
    },
    updateCounter(state, data) {
      Vue.set(state.counters, data.type, data.count);
    },
    updateRecentEmojies(state, emojies) {
      let recentEmojies = Object.assign({}, state.recentEmojies);

      for(let code in emojies) {
        recentEmojies[code] = (recentEmojies[code] || 0) + emojies[code];
      }

      state.recentEmojies = recentEmojies;
    },
    setHiddenDialogs(state, data) {
      state.hiddenDialogs = data;
    }
  },
  getters: {
    lang({ langName }) {
      return getLangFile(langName);
    }
  }
}
