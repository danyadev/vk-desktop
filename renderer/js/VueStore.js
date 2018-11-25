'use strict';

Vue.use(Vuex);

module.exports = new Vuex.Store({
  strict: true,
  state: {
    profiles: {},
    typing: {},
    dialogs: [],
    menuState: false
  },
  actions: {
    getLastMessage({ state }, peerID) {
      let peer = state.dialogs.find((peer) => peer.id == peerID);
      if(!peer) return;

      return peer.items.slice().reverse().find((msg) => {
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
      let peer = state.dialogs.find((peer) => peer.id == data.peer_id);

      if(!peer) state.dialogs.push({ id: data.peer_id, items: [data.msg] });
      else peer.items.push(data.msg);
    },
    editMessage(state, data) {
      let peer = state.dialogs.find((peer) => peer.id == data.peer_id);
      if(!peer) return;

      let index = peer.items.findIndex((item) => item.id == data.msg.id),
          oldMsg = peer.items[index];

      if(index != -1) {
        Vue.set(peer.items, index, Object.assign({}, oldMsg, data.msg));
      }
    },
    removeMessage(state, data) {
      let peer = state.dialogs.find((peer) => peer.id == data.peer_id);
      if(!peer) return;

      let index = peer.items.findIndex((item) => item.id == data.id);

      if(index != -1) Vue.delete(peer.items, index);
    }
  }
});
