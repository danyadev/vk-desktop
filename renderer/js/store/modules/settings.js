'use strict';

function getLangFile(name) {
  return require(`./../../../lang/${name}.js`);
}

module.exports = {
  state: {
    users: Object.assign({}, users.get()),
    activeUser: settings.get('activeUser'),
    counters: settings.get('counters'),
    langName: settings.get('lang'),
    lang: getLangFile(settings.get('lang')),
    recentEmojies: settings.get('recentEmojies'),
    hiddenDialogs: settings.get('hiddenDialogs')
  },
  mutations: {
    updateCounter(state, data) {
      Vue.set(state.counters, data.type, data.count);
      settings.set('counters', state.counters);
    },
    updateRecentEmojies(state, emojies) {
      let recentEmojies = Object.assign({}, state.recentEmojies);

      for(let code in emojies) {
        recentEmojies[code] = (recentEmojies[code] || 0) + emojies[code];
      }

      state.recentEmojies = recentEmojies;
      settings.set('recentEmojies', recentEmojies);
    },
    setHiddenDialogs(state, data) {
      state.hiddenDialogs = data;
      settings.set('hiddenDialogs', data);
    }
  }
}
