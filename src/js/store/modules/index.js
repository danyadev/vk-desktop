import Vue from 'vue';
import { getPhoto } from 'js/utils';

export default {
  state: {
    profiles: {}
  },
  mutations: {
    addProfiles(state, profiles) {
      for(let profile of profiles) {
        profile.photo = getPhoto(profile.photo_50, profile.photo_100);
        Vue.set(state.profiles, profile.id, profile);
      }
    },
    updateProfile(state, profile) {
      let old = state.profiles[profile.id] || {},
          user = { ...old, ...profile };

      user.photo = getPhoto(user.photo_50, user.photo_100);
      Vue.set(state.profiles, user.id, user);
    }
  }
}
