import { mainSettingsStorage } from '../Storage';

export default {
  state: {
    counters: {
      unread: 0,
      unreadUnmuted: 0
    },
    profiles: {},
    hasWindowFrame: mainSettingsStorage.data.useNativeTitlebar
  },

  mutations: {
    setCounters(state, counters) {
      state.counters = counters;
    },

    updateCounters(state, newCounters) {
      state.counters = {
        ...state.counters,
        ...newCounters
      };
      this.dispatch('setBadgeCount');
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
  },

  actions: {
    setBadgeCount({ state, getters }) {
      const settings = getters['settings/settings'];
      const badgeCount = settings.showUnreadCountBadge
        ? settings.countOnlyUnmutedChats
          ? state.counters.unreadUnmuted
          : state.counters.unread
        : 0;

      navigator.setAppBadge(badgeCount);
    }
  }
};
