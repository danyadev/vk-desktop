'use strict';

Vue.use(Vuex);

const { getLastMessage } = require('./../components/messages/methods');

let getNewIndex = (arr, num) => {
  for(let i=0; i<arr.length; i++) {
    if(arr[i] <= num && (!arr[i+1] || arr[i+1] >= num)) {
      return i+1;
    }
  }

  return arr.length - 1;
}

module.exports = new Vuex.Store({
  strict: true,
  state: {
    menuState: false,
    activeChat: null,
    profiles: {},
    peers: [],
    dialogs: [],
    typing: {}
  },
  mutations: {
    // ** Меню **
    setMenuState(state, value) {
      state.menuState = value;
    },
    // ** Профили **
    addProfiles(state, users) {
      for(let user of users) Vue.set(state.profiles, user.id, user);
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
      else {
        let ids = peer.items.map((msg) => msg.id),
            index = getNewIndex(ids, data.msg.id);

        if(!ids.includes(data.msg.id)) peer.items.splice(index, 0, data.msg);
      }
    },
    editMessage(state, data) {
      let peer = state.dialogs.find((peer) => peer.id == data.peer_id);
      if(!peer) return;

      let index = peer.items.findIndex((item) => item.id == data.msg.id),
          oldMsg = peer.items[index],
          msg = Object.assign({}, oldMsg, data.msg);

      if(index != -1) Vue.set(peer.items, index, msg);
      else if(data.force) {
        let lastMsg = getLastMessage(data.peer_id, true);
        if(!lastMsg || lastMsg.id == data.msg.id) peer.items.push(data.msg);
      }
    },
    removeMessage(state, data) {
      let peer = state.dialogs.find((peer) => peer.id == data.peer_id);
      if(!peer) return;

      let index = peer.items.findIndex((item) => item.id == data.id);

      if(index != -1) Vue.delete(peer.items, index);
    },
    // ** Диалог **
    setChat(state, id) {
      state.activeChat = id;
    }
  }
});
