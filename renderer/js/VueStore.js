'use strict';

Vue.use(Vuex);

module.exports = new Vuex.Store({
  strict: true,
  state: {
    profiles: {}
  },
  mutations: {
    addProfile(state, user) {
      Vue.set(state.profiles, user.id, user);
    }
  }
});
