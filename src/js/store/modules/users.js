import Vue from 'vue';
import { users } from '../Storage';
import vkapi from 'js/vkapi';
import { fields } from 'js/utils';

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
    }
  },
  getters: {
    user(state) {
      return state.users[state.activeUser];
    }
  },
  actions: {
    async updateUserData({ commit }) {
      const [ user ] = await vkapi('users.get', { fields });

      commit('updateUser', user);
    }
  }
}
