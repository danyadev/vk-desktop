import Vue from 'vue';

function getState() {
  return {
    menuState: false,
    profiles: {}
  };
}

export default {
  state: getState(),
  mutations: {
    resetState(state) {
      Object.assign(state, getState());
    },
    setMenuState(state, value) {
      state.menuState = value;
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
    }
  }
}
