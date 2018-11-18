'use strict';

Vue.use(Vuex);

module.exports = new Vuex.Store({
  strict: true,
  state: {
    profiles: {}
  },
  mutations: {
    addProfile(state, user) {
      state.profiles[user.id] = user;
    }
  }
});
