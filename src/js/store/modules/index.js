import Vue from 'vue';
import { getPhoto } from 'js/utils';

function updateUserObject(user) {
  user.photo = getPhoto(user.photo_50, user.photo_100);

  if(!user.last_seen) {
    if(user.id > 0) {
      user.last_seen = {
        online: false,
        mobile: false
      };
    }

    return user;
  }

  user.last_seen.online = user.online;
  user.last_seen.mobile = user.online && user.online_mobile;
  user.last_seen.app = user.online_app;

  delete user.online;
  delete user.online_mobile;
  delete user.online_app;

  return user;
}

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
      for(let profile of profiles) {
        Vue.set(state.profiles, profile.id, updateUserObject(profile));
      }
    },
    updateProfile(state, profile) {
      const old = state.profiles[profile.id] || {};
      const user = { ...old, ...profile };

      Vue.set(state.profiles, user.id, user);
    }
  }
}
