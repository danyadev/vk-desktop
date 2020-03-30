function moveArrItem(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
  return arr;
}

export default {
  namespaced: true,

  state: {
    // Список id бесед, которые отображаются в списке бесед
    // [peer_id]
    peerIds: [],

    // Полностью ли загружен список диалогов
    isMessagesPeersLoaded: false,

    // Все беседы, которые были загружены в приложение
    // { peer_id: { peer, msg } }
    conversations: {},

    // Список юзеров, которые печатают в различных беседах
    // { peer_id: { user_id: { time, type } } }
    typing: {},

    // Списки сообщений у бесед
    // { peer_id: [message] }
    messages: {},

    // Отправленные, но еще не полученные сообщения
    // { peer_id: [{ random_id, text, date, error, hasAttachment }] }
    loadingMessages: {},

    // Некоторая информация о беседах, необходимая вне компонента чата
    // { peer_id: { opened, loading } }
    peersConfig: {}
  },

  mutations: {
    updatePeersList(state, { id, remove }) {
      if (remove) {
        const index = state.peerIds.indexOf(id);

        if (index !== -1) {
          state.peerIds.splice(index, 1);
        }
      } else {
        state.peerIds.push(id);
      }
    },

    addConversations(state, conversations) {
      for (const conversation of conversations) {
        const { id } = conversation.peer;

        if (!state.conversations[id]) {
          state.conversations[id] = conversation;
        } else {
          this.commit('messages/updateConversation', conversation);
        }

        if (!state.peerIds.includes(id)) {
          state.peerIds.push(id);
        }
      }
    },

    updateConversation(state, { peer, msg, removeMsg }) {
      const conv = state.conversations[peer.id] || {};

      state.conversations[peer.id] = {
        peer: { ...conv.peer, ...peer },
        msg: removeMsg ? {} : { ...conv.msg, ...msg }
      };
    },

    removeConversationMessages(state, peer_id) {
      state.messages[peer_id] = [];
    },

    moveConversation(state, { peer_id, isNewMsg, isRestoreMsg }) {
      const index = state.peerIds.indexOf(peer_id);

      if (index === -1) {
        return;
      }

      if (isNewMsg) {
        return moveArrItem(state.peerIds, index, 0);
      }

      const peers = this.getters['messages/peersList'];
      const { id } = peers[index].msg;
      let newIndex = index;

      if (isRestoreMsg) {
        if (index === 0) {
          return;
        }

        for (let i = 0; i < index; i++) {
          if (peers[i].msg.id < id) {
            newIndex = i;
            break;
          }
        }
      } else if (index !== peers.length - 1) {
        for (let i = peers.length - 1; i > index; i--) {
          if (peers[i].msg.id > id) {
            newIndex = i;
            break;
          }
        }
      } else {
        if (!state.isMessagesPeersLoaded) {
          state.peerIds.splice(index, 1);
        }

        return;
      }

      if (newIndex === peers.length - 1 && !state.isMessagesPeersLoaded) {
        state.peerIds.splice(index, 1);
      } else {
        moveArrItem(state.peerIds, index, newIndex);
      }
    },

    addUserTyping(state, { peer_id, user_id, type, time = 5 }) {
      const users = { ...state.typing[peer_id] };

      users[user_id] = { type, time };
      state.typing[peer_id] = users;
    },

    removeUserTyping(state, { peer_id, user_id, clearChat }) {
      if (clearChat) {
        state.typing[peer_id] = {};
      } else {
        const users = state.typing[peer_id];

        if (users) {
          delete users[user_id];
        }
      }
    },

    addMessages(state, { peer_id, messages, addNew }) {
      const oldMessages = state.messages[peer_id] || [];
      const oldMessageIds = new Set(oldMessages.map(({ id }) => id));
      const newMessages = messages.filter(({ id }) => !oldMessageIds.has(id));

      state.messages[peer_id] = addNew
        ? [...oldMessages, ...newMessages]
        : [...newMessages, ...oldMessages];
    },

    insertMessage(state, { peer_id, msg }) {
      // Список сообщений отображается в порядке от меньшего id к большему
      // [1, 2, 3, 4, 5]
      const list = [...state.messages[peer_id] || []];

      if (!list.length || msg.id > list[list.length - 1].id) {
        // В конец
        list.push(msg);
      } else if (msg.id < list[0].id) {
        // В начало
        list.unshift(msg);
      } else {
        // Где-то между сообщениями
        for (let i = list.length - 1; i >= 0; i--) {
          if (msg.id > list[i].id) {
            list.splice(i + 1, 0, msg);
            break;
          }
        }
      }

      state.messages[peer_id] = list;
    },

    editMessage(state, { peer_id, msg }) {
      const list = [...state.messages[peer_id] || []];
      const index = list.findIndex(({ id }) => id === msg.id);

      if (index !== -1) {
        list[index] = { ...list[index], ...msg };
        state.messages[peer_id] = list;
      }
    },

    removeMessages(state, { peer_id, msg_ids }) {
      const messages = [...state.messages[peer_id] || []];
      state.messages[peer_id] = messages.filter(({ id }) => !msg_ids.includes(id));
    },

    // addLoadingMessage(state, { peer_id, msg }) {
    //   const messages = [...state.loadingMessages[peer_id] || [], msg];
    //
    //   Vue.set(state.loadingMessages, peer_id, messages);
    // },
    //
    // editLoadingMessage(state, { peer_id, random_id, error }) {
    //   const messages = [...state.loadingMessages[peer_id] || []];
    //   const index = messages.findIndex((msg) => msg.random_id == random_id);
    //
    //   if(index !== -1) {
    //     Vue.set(messages, index, { ...messages[index], error });
    //     Vue.set(state.loadingMessages, peer_id, messages);
    //   }
    // },
    //
    // removeLoadingMessage(state, { peer_id, random_id }) {
    //   const messages = [...state.loadingMessages[peer_id] || []];
    //   const index = messages.findIndex((msg) => msg.random_id == random_id);
    //
    //   if(index !== -1) {
    //     messages.splice(index, 1);
    //     Vue.set(state.loadingMessages, peer_id, messages);
    //   }
    // },

    updatePeerConfig(state, { peer_id, ...data }) {
      state.peersConfig[peer_id] = {
        ...state.peersConfig[peer_id],
        ...data
      };
    }
  },

  getters: {
    peersList(state) {
      return state.peerIds.map((id) => state.conversations[id]);
    }
  }
};
