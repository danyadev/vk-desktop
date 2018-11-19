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
    addTyping(state, data) {
      if(!state.typing[data.peer]) Vue.set(state.typing, data.peer, {});

      Vue.set(state.typing[data.peer], data.id, data.type);
    },
    removeTyping(state, data) {
      Vue.delete(state.typing[data.peer], data.id);
    }
  }
});
