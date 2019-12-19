import Vue from 'vue';

function moveArrItem(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0]);

  return arr;
}

export default {
  state: {
    // Все беседы, которые были загружены в приложение
    // { peer_id: { peer, msg } }
    conversations: {},
    // Беседы, которые отображаются в списке бесед
    // [peer_id]
    peersList: [],
    // Списки сообщений у бесед
    // { peer_id: [message] }
    messages: {},
    // Беседы, которые были открыты в приложении
    // [peer_id]
    openedChats: [],
    // Список бесед, которые сейчас загружаются
    // т.к. реактивность нам не нужна, мы можем использовать Set
    loadingPeers: new Set(),
    // Отправленные, но еще не полученные сообщения
    // { peer_id: [{ random_id, text, date, error, hasAttachment }] }
    loadingMessages: {},
    // Список юзеров, которые печатают в различных беседах
    // { peer_id: { user_id: { time, type } } }
    typing: {}
  },

  mutations: {
    updatePeersList(state, { id, remove }) {
      if(remove) {
        const index = state.peersList.indexOf(id);
        if(~index) state.peersList.splice(index, 1);
      } else {
        state.peersList.push(id);
      }
    },

    addConversations(state, conversations, sadsa) {
      for(const conversation of conversations) {
        if(!state.conversations[conversation.peer.id]) {
          Vue.set(state.conversations, conversation.peer.id, conversation);
        } else {
          this.commit('messages/updateConversation', conversation);
        }

        if(!state.peersList.includes(conversation.peer.id)) {
          state.peersList.push(conversation.peer.id);
        }
      }
    },

    updateConversation(state, { peer, msg }) {
      const conv = { ...state.conversations[peer.id] || {} };
      conv.peer = Object.assign({}, conv.peer, peer);
      conv.msg = Object.assign({}, conv.msg, msg);

      Vue.set(state.conversations, peer.id, conv);
    },

    removeConversationMessages(state, peer_id) {
      Vue.set(state.messages, peer_id, []);
    },

    moveConversation(state, { peer_id, newMsg, restoreMsg }) {
      const index = state.peersList.indexOf(peer_id);
      if(!~index) return;

      if(newMsg) {
        return moveArrItem(state.peersList, index, 0);
      }

      const peers = this.getters['messages/conversationsList'];
      const { id } = peers[index].msg;
      let newIndex = index;

      if(restoreMsg) {
        if(!index) return;

        for(let i = 0; i < index; i++) {
          if(peers[i].msg.id < id) {
            newIndex = i;
            break;
          }
        }
      } else if(index != peers.length-1) {
        for(let i = peers.length-1; i > index; i--) {
          if(peers[i].msg.id > id) {
            newIndex = i;
            break;
          }
        }
      } else {
        return Vue.delete(state.peersList, index);
      }

      // Последний элемент в списке
      if(newIndex == state.peersList.length-1) {
        Vue.delete(state.peersList, index);
      } else {
        moveArrItem(state.peersList, index, newIndex);
      }
    },

    addMessages(state, { peer_id, messages, addNew }) {
      const oldMsgs = state.messages[peer_id] || [];
      const newMsgs = messages.filter(({ id }) => {
        return oldMsgs.findIndex((msg) => msg.id == id) == -1
      });
      const newList = addNew ? [...oldMsgs, ...newMsgs] : [...newMsgs, ...oldMsgs];

      Vue.set(state.messages, peer_id, newList);
    },

    insertMessage(state, { peer_id, msg }) {
      const list = [...state.messages[peer_id] || []];

      if(!list.length || msg.id > list[list.length-1].id) {
        list.push(msg);
      } else if(msg.id < list[0].id) {
        list.unshift(msg);
      } else {
        for(let i = list.length-1; i >= 0; i--) {
          if(list[i].id < msg.id) {
            list.splice(i+1, 0, msg);
            break;
          }
        }
      }

      Vue.set(state.messages, peer_id, list);
    },

    editMessage(state, { peer_id, msg }) {
      const list = [...state.messages[peer_id] || []];
      const index = list.findIndex(({ id }) => id == msg.id);
      if(!~index) return;

      list[index] = { ...list[index], ...msg };

      Vue.set(state.messages, peer_id, list);
    },

    removeMessages(state, { peer_id, msg_ids }) {
      const messages = [...state.messages[peer_id] || []];
      const newMessages = [];

      for(const msg of messages) {
        if(!msg_ids.includes(msg.id)) newMessages.push(msg);
      }

      Vue.set(state.messages, peer_id, newMessages);
    },

    addLoadingMessage(state, { peer_id, msg }) {
      const messages = [...state.loadingMessages[peer_id] || [], msg];

      Vue.set(state.loadingMessages, peer_id, messages);
    },

    editLoadingMessage(state, { peer_id, random_id, error }) {
      const messages = [...state.loadingMessages[peer_id] || []];
      const index = messages.findIndex((msg) => msg.random_id == random_id);

      if(~index) {
        Object.assign(messages[index], { error });
        Vue.set(state.loadingMessages, peer_id, messages);
      }
    },

    removeLoadingMessage(state, { peer_id, random_id }) {
      const messages = [...state.loadingMessages[peer_id] || []];
      const index = messages.findIndex((msg) => msg.random_id == random_id);

      if(~index) {
        messages.splice(index, 1);
        Vue.set(state.loadingMessages, peer_id, messages);
      }
    },

    addOpenedChat(state, peer_id) {
      state.openedChats.push(peer_id);
    },

    addUserTyping(state, { peer_id, user_id, type, time = 5 }) {
      const users = { ...state.typing[peer_id] || {} };

      users[user_id] = { type, time };
      Vue.set(state.typing, peer_id, users);
    },

    removeUserTyping(state, { peer_id, user_id }) {
      const users = { ...state.typing[peer_id] || {} };

      delete users[user_id];
      Vue.set(state.typing, peer_id, user_id ? users : {});
    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
