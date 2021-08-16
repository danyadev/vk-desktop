export default {
  state: {
    menuCounters: {},
    profiles: {}
  },

  mutations: {
    setMenuCounters(state, counters) {
      state.menuCounters = counters;
    },

    updateMenuCounters(state, { name, value }) {
      state.menuCounters[name] = value;
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

      state.profiles[profile.id] = {
        ...old,
        ...profile
      };
    }
  }
};
