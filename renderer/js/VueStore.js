'use strict';

Vue.use(Vuex);

const { loadProfile } = require('./../components/messages/methods');

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
    profiles: {},
    conversations: {},
    peersList: [],
    typing: {},
    activeChat: null,
    messages: {}
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
    // ** Список бесед **
    addConversation(state, data) {
      let conversation = state.conversations[data.peer.id],
          addMsg = false

      if(!conversation) addMsg = true;

      conversation = conversation || {};
      conversation.peer = Object.assign({}, conversation.peer, data.peer);
      conversation.lastMsg = Object.assign({}, conversation.lastMsg, data.lastMsg);

      if(addMsg) {
        this.commit('addMessage', {
          peer_id: data.peer.id,
          msg: conversation.lastMsg
        });
      }

      Vue.set(state.conversations, data.peer.id, conversation);

      let hasPeer = state.peersList.find(({ id }) => id == data.peer.id);
      if(!hasPeer) state.peersList.push({ id: data.peer.id });
    },
    editPeer(state, data) {
      let conversation = state.conversations[data.id] || {};

      conversation.peer = Object.assign({}, conversation.peer, data);

      Vue.set(state.conversations, data.id, Object.assign({}, conversation));
    },
    removePeer(state, id) {
      let index = state.peersList.findIndex((peer) => peer.id == id);
      if(index != -1) Vue.delete(state.peersList, index);
    },
    updateLastMsg(state, data) {
      let conversation = state.conversations[data.peer_id] || {};

      conversation.lastMsg = Object.assign({}, conversation.lastMsg, data.msg);

      Vue.set(state.conversations, data.peer_id, conversation);
    },
    sortPeers(state) {
      let lastMsg = this.getters.lastMessage;

      state.peersList.sort((p1, p2) => {
        return lastMsg(p1.id).date < lastMsg(p2.id).date ? 1 : -1;
      });
    },
    // ** Диалог и сообщения **
    setChat(state, id) {
      state.activeChat = id;
    },
    addMessage(state, data) {
      let messages = state.messages[data.peer_id] || [];
      messages.push(data.msg);
      Vue.set(state.messages, data.peer_id, messages);

      let conv = state.conversations[data.peer_id],
          peerObj = conv && conv.peer,
          visible = state.peersList.find(({ id }) => id == data.peer_id);

      if(!visible && peerObj) {
        state.peersList.unshift({ id: peerObj.id });
      }
    },
    editMessage(state, data) {
      let messages = state.messages[data.peer_id] || [],
          msgIndex = messages.findIndex(({ id }) => id == data.msg.id),
          msg = messages[msgIndex],
          dialog = state.conversations[data.peer_id],
          lastMsg = dialog && dialog.lastMsg;

      if(msg) {
        messages[msgIndex] = Object.assign({}, msg, data.msg);
        Vue.set(state.messages, data.peer_id, messages);
      }

      if(lastMsg && data.msg.id == lastMsg.id) {
        Vue.set(dialog, 'lastMsg', Object.assign({}, lastMsg, data.msg));
      }
    },
    removeMessage(state, data) {
      let messages = state.messages[data.peer_id] || [],
          index = messages.findIndex(({ id }) => id == data.msg_id);

      if(index != -1) Vue.delete(messages, index);
    },
    // ** Тайпинг **
    setTyping(state, data) {
      if(!state.typing[data.peer]) Vue.set(state.typing, data.peer, {});

      Vue.set(state.typing[data.peer], data.id, data.data);
    },
    removeTyping(state, data) {
      Vue.delete(state.typing[data.peer], data.id);
    }
  },
  getters: {
    peers(state) {
      return state.peersList.map(({ id }) => {
        return state.conversations[id].peer;
      });
    },
    lastMessage: (state, getters) => (peerID) => {
      let dialog = state.conversations[peerID];
      if(dialog) return dialog.lastMsg;
    },
    typingMsg: (state) => (peerID) => {
      let text = [], audio = [], msg = '';

      for(let id in state.typing[peerID]) {
        if(state.typing[peerID][id].type == 'audio') audio.push(id);
        else text.push(id);
      }

      let name = (id) => {
        // если это лс, то просто писать "печатает"
        if(peerID < 2e9) return '';

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
