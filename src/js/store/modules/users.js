import Vue from 'vue';
import { users } from '../Storage';

export default {
  state: users.data,
  mutations: {
    setActiveUser(state, id) {
      state.activeUser = id;
    },
    updateUser(state, data) {
      const user = state.users[data.id];
      const newUser = Object.assign({}, user, data);

      Vue.set(state.users, data.id, newUser);
    },
    removeUser(state, id) {
      Vue.delete(state.users, id);
    },
    setTrusredHash(state, { login, hash }) {
      Vue.set(state.trustedHashes, login, hash);
    }
  },
  getters: {
    user(state) {
      return state.users[state.activeUser];
    }
  }
}
