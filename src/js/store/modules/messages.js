export default {
  namespaced: true,

  state: {
    // Список id бесед, которые отображаются в списке бесед
    // [peer_id]
    peerIds: [],

    // Все беседы, которые были загружены в приложение
    // { peer_id: { peer, msg } }
    conversations: {},

    // Список юзеров, которые печатают в различных беседах
    // { peer_id: { user_id: { time, type } } }
    typing: {}
  },

  mutations: {
    updatePeersList(state, { id, remove }) {
      if (remove) {
        const index = state.peerIds.indexOf(id);

        if (~index) {
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


    addUserTyping(state, { peer_id, user_id, type, time = 5 }) {
      const users = { ...state.typing[peer_id] };

      users[user_id] = { type, time };
      state.typing[peer_id] = users;
    },

    removeUserTyping(state, { peer_id, user_id }) {
      const users = { ...state.typing[peer_id] };

      delete users[user_id];
      state.typing[peer_id] = user_id ? users : {};
    }

    // removeConversationMessages(state, peer_id) {
    //   Vue.set(state.messages, peer_id, []);
    // },
    //
    // moveConversation(state, { peer_id, newMsg, restoreMsg }) {
    //   const index = state.peersList.indexOf(peer_id);
    //   if(!~index) return;
    //
    //   if(newMsg) {
    //     return moveArrItem(state.peersList, index, 0);
    //   }
    //
    //   const peers = this.getters['messages/conversationsList'];
    //   const { id } = peers[index].msg;
    //   let newIndex = index;
    //
    //   if(restoreMsg) {
    //     if(!index) return;
    //
    //     for(let i = 0; i < index; i++) {
    //       if(peers[i].msg.id < id) {
    //         newIndex = i;
    //         break;
    //       }
    //     }
    //   } else if(index != peers.length-1) {
    //     for(let i = peers.length-1; i > index; i--) {
    //       if(peers[i].msg.id > id) {
    //         newIndex = i;
    //         break;
    //       }
    //     }
    //   } else {
    //     return Vue.delete(state.peersList, index);
    //   }
    //
    //   // Последний элемент в списке
    //   if(newIndex == state.peersList.length-1) {
    //     Vue.delete(state.peersList, index);
    //   } else {
    //     moveArrItem(state.peersList, index, newIndex);
    //   }
    // },
    //
    // addMessages(state, { peer_id, messages, addNew }) {
    //   const oldMsgs = state.messages[peer_id] || [];
    //   const newMsgs = messages.filter(({ id }) => {
    //     return oldMsgs.findIndex((msg) => msg.id == id) == -1
    //   });
    //   const newList = addNew ? [...oldMsgs, ...newMsgs] : [...newMsgs, ...oldMsgs];
    //
    //   Vue.set(state.messages, peer_id, newList);
    // },
    //
    // insertMessage(state, { peer_id, msg }) {
    //   const list = [...state.messages[peer_id] || []];
    //
    //   if(!list.length || msg.id > list[list.length-1].id) {
    //     list.push(msg);
    //   } else if(msg.id < list[0].id) {
    //     list.unshift(msg);
    //   } else {
    //     for(let i = list.length-1; i >= 0; i--) {
    //       if(list[i].id < msg.id) {
    //         list.splice(i+1, 0, msg);
    //         break;
    //       }
    //     }
    //   }
    //
    //   Vue.set(state.messages, peer_id, list);
    // },
    //
    // editMessage(state, { peer_id, msg }) {
    //   const list = [...state.messages[peer_id] || []];
    //   const index = list.findIndex(({ id }) => id == msg.id);
    //   if(!~index) return;
    //
    //   list[index] = { ...list[index], ...msg };
    //
    //   Vue.set(state.messages, peer_id, list);
    // },
    //
    // removeMessages(state, { peer_id, msg_ids }) {
    //   const messages = [...state.messages[peer_id] || []];
    //   const newMessages = [];
    //
    //   for(const msg of messages) {
    //     if(!msg_ids.includes(msg.id)) newMessages.push(msg);
    //   }
    //
    //   Vue.set(state.messages, peer_id, newMessages);
    // },
    //
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
    //   if(~index) {
    //     Vue.set(messages, index, { ...messages[index], error });
    //     Vue.set(state.loadingMessages, peer_id, messages);
    //   }
    // },
    //
    // removeLoadingMessage(state, { peer_id, random_id }) {
    //   const messages = [...state.loadingMessages[peer_id] || []];
    //   const index = messages.findIndex((msg) => msg.random_id == random_id);
    //
    //   if(~index) {
    //     messages.splice(index, 1);
    //     Vue.set(state.loadingMessages, peer_id, messages);
    //   }
    // },
    //
    // updatePeerConfig(state, { peer_id, ...data }) {
    //   const config = { ...state.peersConfig[peer_id] || {}, ...data };
    //   Vue.set(state.peersConfig, peer_id, config);
    // }
  },

  getters: {
    peersList(state) {
      return state.peerIds.map((id) => state.conversations[id]);
    }
  }
};
