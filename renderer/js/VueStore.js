'use strict';

Vue.use(Vuex);

module.exports = new Vuex.Store({
  strict: true,
  state: {
    profiles: {},
    typing: {}
  },
  mutations: {
    addProfile(state, user) {
      Vue.set(state.profiles, user.id, user);
    },
    updateProfile(state, user) {
      let old = state.profiles[user.id] || {};

      Vue.set(state.profiles, user.id, Object.assign({}, old, user));
    },
    addTyping(state, data) {
      if(!state.typing[data.peer]) Vue.set(state.typing, data.peer, {});

      Vue.set(state.typing[data.peer], data.id, data.data);
    },
    removeTyping(state, data) {
      Vue.delete(state.typing[data.peer], data.id);
    }
  }
});
