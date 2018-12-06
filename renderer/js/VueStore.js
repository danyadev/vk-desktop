'use strict';

Vue.use(Vuex);

const { getLastMessage, loadProfile } = require('./../components/messages/methods');

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
    // ** Беседы **
    setChat(state, id) {
      state.activeChat = id;
    },
    addPeer(state, data) {
      state.peers.push(data);
    },
    removePeer(state, id) {
      let index = state.peers.findIndex((peer) => peer.id == id);

      if(index != -1) Vue.delete(state.peers, index);
    },
    editPeer(state, data) {
      let peer = state.peers.find((peer) => peer.id == data.id);
      if(peer) Vue.set(state.peers, data.id, Object.assign({}, peer, data));
    }
  },
  getters: {
    typingMsg: (state) => (peer_id) => {
      let text = [], audio = [], msg = '';

      for(let id in state.typing[peer_id]) {
        if(state.typing[peer_id][id].type == 'audio') audio.push(id);
        else text.push(id);
      }

      let name = (id) => {
        // если это лс, то просто писать "печатает"
        if(peer_id < 2e9) return '';

        let user = state.profiles[id];
        if(!user || !user.photo_50) return loadProfile(id), '...';

        let last_sym = user.last_name ? user.last_name[0] + '.' : '';
        return user.name || `${user.first_name} ${last_sym}`;
      }

      if(text.length) {
        if(text.length > 2) msg += `${name(text[0])} и еще ${text.length-1}`;
        else {
          for(let i in text) {
            let id = text[i];

            if(i == 0) msg += `${name(id)}`;
            else msg += ` и ${name(id)}`;
          }
        }

        msg += text.length == 1 ? ' печатает' : ' печатают';
      }

      if(audio.length) {
        if(text.length) msg += ' и ';

        if(audio.length > 2) msg += `${name(audio[0])} и еще ${audio.length-1}`;
        else {
          for(let i in audio) {
            let id = audio[i];

            if(i == 0) msg += `${name(id)}`;
            else msg += ` и ${name(id)}`;
          }
        }

        msg += (audio.length == 1 ? ' записывает' : ' записывают') + ' аудио';
      }

      return msg;
    }
  }
});
