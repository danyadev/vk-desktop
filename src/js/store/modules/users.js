import { usersStorage } from '../Storage';
import { copyObject } from '../../copyObject';

export default {
  namespaced: true,

  state: usersStorage.data,

  mutations: {
    setActiveUser(state, id) {
      state.activeUserID = id;
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

  actions: {
    logout(context, needRemoveUser) {
      const newState = copyObject(usersStorage.data);

      newState.activeUserID = null;

      if (needRemoveUser) {
        delete newState.users[context.state.activeUserID];
      }

      usersStorage.update(newState);
      window.location.reload();
    }
  },

  getters: {
    user(state) {
      return state.users[state.activeUserID];
    }
  }
};
