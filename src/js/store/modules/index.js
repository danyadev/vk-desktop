import { mainSettingsStorage } from '../Storage';

export default {
  state: {
    menuCounters: {},
    profiles: {},
    hasWindowFrame: mainSettingsStorage.data.useNativeTitlebar
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
