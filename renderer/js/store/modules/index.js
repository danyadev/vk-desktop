'use strict';

const { loadProfile } = require('./../../../components/messages/methods');

function getMinIndex(arr, num) {
  for(let i = 0; i<arr.length; i++) {
    if(arr[i] <= num) return i;
  }

  return arr.length;
}

module.exports = {
  state: {
    menuState: false,
    profiles: {},
    conversations: {},
    peersList: [],
    typing: {},
    messages: {}
  },
  mutations: {
    // ** Меню **
    setMenuState(state, value) {
      state.menuState = value;
    },
    // ** Профили **
    addProfiles(state, users) {
      for(let user of users) {
        user.photo = devicePixelRatio >= 2 ? user.photo_100 : user.photo_50;
        Vue.set(state.profiles, user.id, user);
      }
    },
    updateProfile(state, user) {
      let old = state.profiles[user.id];

      if(old) {
        user.photo = (devicePixelRatio >= 2 ? user.photo_100 : user.photo_50) || user.photo || old.photo;
        Vue.set(state.profiles, user.id, Object.assign({}, old, user));
      }
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

      let hasPeer = state.peersList.find((id) => id == data.peer.id);
      if(!hasPeer) state.peersList.push(data.peer.id);
    },
    editPeer(state, data) {
      let conversation = state.conversations[data.id] || {};

      conversation.peer = Object.assign({}, conversation.peer, data);

      Vue.set(state.conversations, data.id, Object.assign({}, conversation));
    },
    removePeer(state, id) {
      let index = state.peersList.findIndex((_id) => _id == id);
      if(index != -1) state.peersList.splice(index, 1);
    },
    updateLastMsg(state, data) {
      let conversation = state.conversations[data.peer_id] || {};

      conversation.lastMsg = Object.assign({}, conversation.lastMsg, data.msg);

      Vue.set(state.conversations, data.peer_id, conversation);
    },
    incrementUnreadCount(state, data) {
      let conversation = state.conversations[data.peer_id] || {},
          peer = conversation.peer;

      if(!peer) return;

      conversation.peer = Object.assign({}, peer, {
        unread: data.state ? peer.unread + 1 : 0
      });

      Vue.set(state.conversations, data.peer_id, conversation);
    },
    movePeer(state, id) {
      let lastMsg = this.getters.lastMessage(id),
          date = lastMsg && lastMsg.date;

      if(!date) return;

      let dates = state.peersList.map((id) => {
        return this.getters.lastMessage(id).date;
      });

      let index = getMinIndex(dates, date),
          oldIndex = state.peersList.findIndex((_id) => _id == id);

      if(oldIndex != index && state.peersList[oldIndex]) {
        state.peersList.move(oldIndex, index);
      }
    },
    // ** Диалог и сообщения **
    addMessage(state, data) {
      let messages = state.messages[data.peer_id] || [],
          ids = messages.map((msg) => msg.id),
          index = utils.getNewIndex(ids, data.msg.id);

      if(!ids.includes(data.msg.id)) messages.splice(index, 0, data.msg);

      Vue.set(state.messages, data.peer_id, messages);

      let conv = state.conversations[data.peer_id],
          peerObj = conv && conv.peer,
          visible = state.peersList.find((id) => id == data.peer_id);

      if(!visible && peerObj && !data.notNewMsg && !data.msg.hidden) {
        state.peersList.unshift(peerObj.id);
      }
    },
    editMessage(state, data) {
      let messages = state.messages[data.peer_id] || [],
          msgIndex = messages.findIndex(({ id }) => data.msg && id == data.msg.id),
          msg = messages[msgIndex],
          dialog = state.conversations[data.peer_id],
          lastMsg = dialog && dialog.lastMsg;

      if(msg) {
        messages[msgIndex] = Object.assign({}, msg, data.msg);
        Vue.set(state.messages, data.peer_id, messages);
      }

      if(lastMsg && data.msg && data.msg.id == lastMsg.id) {
        Vue.set(dialog, 'lastMsg', Object.assign({}, lastMsg, data.msg));
      }
    },
    removeMessage(state, data) {
      let messages = state.messages[data.peer_id] || [],
          index = messages.findIndex(({ id }) => id == data.msg_id);

      if(index != -1) messages.splice(index, 1);
    },
    // ** Тайпинг **
    setTyping(state, data) {
      if(!state.typing[data.peer_id]) Vue.set(state.typing, data.peer_id, {});

      Vue.set(state.typing[data.peer_id], data.from_id, data.data);
    },
    removeTyping(state, data) {
      Vue.delete(state.typing[data.peer_id], data.from_id);
    }
  },
  getters: {
    peers(state) {
      return state.peersList.map((id) => {
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
        if(!user) return loadProfile(id), '...';

        let last_sym = user.last_name ? user.last_name[0] + '.' : '';
        return user.name || `${user.first_name} ${last_sym}`;
      }

      if(text.length) {
        switch(text.length) {
          case 1:
            msg = app.l('im_typing_text', 0, [name(text[0])]);
            break;
          case 2:
            msg = app.l('im_typing_text', 1, [name(text[0]), name(text[1])]);
            break;
          default:
            msg = app.l('im_typing_text', 2, [name(text[0]), text.length-1]);
            break;
        }
      }

      if(audio.length) {
        if(text.length) msg += ` ${app.l('and')} `;

        switch(audio.length) {
          case 1:
            msg += app.l('im_typing_audio', 0, [name(audio[0])]);
            break;
          case 2:
            msg += app.l('im_typing_audio', 1, [name(audio[0]), name(audio[1])]);
            break;
          default:
            msg += app.l('im_typing_audio', 2, [name(audio[0]), audio.length-1]);
            break;
        }
      }

      return msg;
    }
  }
}
