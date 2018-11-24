'use strict';

Vue.use(Vuex);

module.exports = new Vuex.Store({
  strict: true,
  state: {
    profiles: {},
    typing: {},
    dialogs: {},
    menuState: false
  },
  actions: {
    getLastMessage({ state }, peer) {
      if(!state.dialogs[peer]) return;

      return state.dialogs[peer].slice(0).reverse().find((msg) => {
        return !msg.deleted;
      });
    }
  },
  mutations: {
    // ** Меню **
    setMenuState(state, value) {
      state.menuState = value;
    },
    // ** Профили **
    addProfile(state, user) {
      Vue.set(state.profiles, user.id, user);
    },
    updateProfile(state, user) {
      let old = state.profiles[user.id] || {};

      Vue.set(state.profiles, user.id, Object.assign({}, old, user));
    },
    // ** Тайпинг **
    addTyping(state, data) {
      if(!state.typing[data.peer]) Vue.set(state.typing, data.peer, {});

      Vue.set(state.typing[data.peer], data.id, data.data);
    },
    removeTyping(state, data) {
      Vue.delete(state.typing[data.peer], data.id);
    },
    // ** Сообщения **
    addMessage(state, data) {
      if(!state.dialogs[data.peer_id]) Vue.set(state.dialogs, data.peer_id, []);

      state.dialogs[data.peer_id].push(data.msg);
    },
    editMessage(state, data) {
      if(!state.dialogs[data.peer_id]) return;

      let index = state.dialogs[data.peer_id].findIndex((msg) => msg.id == data.msg.id),
          old = state.dialogs[data.peer_id][index];

      if(index != -1) {
        Vue.set(state.dialogs[data.peer_id], index, Object.assign({}, old, data.msg));
      }
    },
    removeMessage(state, data) {
      if(!state.dialogs[data.peer]) return;

      let index = state.dialogs[data.peer].findIndex((msg) => msg.id == data.id);
      if(index != -1) Vue.delete(state.dialogs[data.peer], index);
    }
  }
});
