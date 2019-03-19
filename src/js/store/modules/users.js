import Vue from 'vue';
import { users } from './../Storage';

export default {
  state: users.data,
  mutations: {
    setActiveUser(state, id) {
      state.activeUser = id;
    },
    updateUser(state, data) {
      let user = state.users[data.id],
          newUser = Object.assign({}, user, data);

      Vue.set(state.users, data.id, newUser);
    }
  }
}
