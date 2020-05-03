import { usersStorage } from '../Storage';

export default {
  namespaced: true,

  state: usersStorage.data,

  mutations: {
    setActiveUser(state, id) {
      state.activeUser = id;
    },

    updateUser(state, data) {
      state.users[data.id] = {
        ...state.users[data.id],
        ...data
      };
    },

    removeUser(state, id) {
      delete state.users[id];
    },

    setTrustedHash(state, { login, hash }) {
      state.trustedHashes[login] = hash;
    }
  },

  getters: {
    user(state) {
      return state.users[state.activeUser];
    }
  }
};
