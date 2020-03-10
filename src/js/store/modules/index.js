import Vue from 'vue';

export default {
  state: {
    menuState: false,
    menuCounters: {},
    profiles: {},
    isThemeChange: false,
    contextMenuEvent: null
  },

  mutations: {
    setMenuState(state, value) {
      state.menuState = value;
    },

    setMenuCounters(state, counters) {
      state.menuCounters = counters;
    },

    updateMenuCounters(state, { name, value }) {
      Vue.set(state.menuCounters, name, value);
    },

    addProfiles(state, profiles) {
      const result = profiles.reduce((users, user) => {
        users[user.id] = user;
        return users;
      }, {});

      state.profiles = {
        ...state.profiles,
        ...result
      };
    },

    updateProfile(state, profile) {
      const old = state.profiles[profile.id] || {};
      const user = { ...old, ...profile };

      Vue.set(state.profiles, user.id, user);
    },

    setContextMenuEvent(state, event) {
      state.contextMenuEvent = event;
    }
  }
}
