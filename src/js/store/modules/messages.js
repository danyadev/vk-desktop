import Vue from 'vue';

function moveArrItem(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0]);

  return arr;
}

function getState() {
  return {
    // Все беседы, которые были загружены в приложение
    // { peer_id: { peer, msg } }
    conversations: {},
    // Беседы, которые отображаются в списке бесед
    // [peer_id]
    peersList: [],
    // Списки сообщений у бесед
    // { peer_id: [message] }
    messages: {}
  };
}

export default {
  state: getState(),
  mutations: {
    resetState(state) {
      Object.assign(state, getState());
    },

    addConversations(state, conversations) {
      for(const conversation of conversations) {
        Vue.set(state.conversations, conversation.peer.id, conversation);

        if(!state.peersList.includes(conversation.peer.id)) {
          state.peersList.push(conversation.peer.id);
        }
      }
    },

    updateConversation(state, { peer, msg = {} }) {
      const conv = { ...state.conversations[peer.id] || {} };
      conv.peer = Object.assign({}, conv.peer, peer);
      conv.msg = Object.assign({}, conv.msg, msg);

      Vue.set(state.conversations, peer.id, conv);
    },

    removeConversation(state, peer_id) {
      const index = state.peersList.indexOf(peer_id);

      if(index != -1) Vue.delete(state.peersList, index);
    },

    addMessages(state, { peer_id, messages, addNew }) {
      const oldMsgs = state.messages[peer_id] || [];
      const newMsgs = messages.filter(({ id }) => {
        return oldMsgs.findIndex((msg) => msg.id == id) == -1
      });

      const newList = addNew ? [...oldMsgs, ...newMsgs] : [...newMsgs, ...oldMsgs];

      Vue.set(state.messages, peer_id, newList);
    },

    removeMessages(state, { peer_id, msg_ids }) {
      let messages = [...state.messages[peer_id] || []];

      for(let i in messages) {
        if(msg_ids.includes(messages[i].id)) messages.splice(i, 1);
      }

      Vue.set(state.messages, peer_id, messages);
    },

    moveConversation(state, { peer_id, newMsg, restoreMsg }) {
      const index = state.peersList.indexOf(peer_id);
      if(index == -1) return;

      if(newMsg) {
        moveArrItem(state.peersList, index, 0);
      } else {
        const peers = this.getters['messages/conversationsList'];
        const peerDate = peers[index].msg.date;
        let newIndex = index;

        if(restoreMsg && index > 0) {
          for(let i=0; i<index; i++) {
            if(peers[i].msg.date < peerDate) {
              newIndex = i;
              break;
            }
          }
        } else if(index != peers.length-1) {
          for(let i=peers.length-1; i>index; i--) {
            if(peers[i].msg.date > peerDate) {
              newIndex = i;
              break;
            }
          }
        } else {
          return Vue.delete(state.peersList, index);
        }

        moveArrItem(state.peersList, index, newIndex);
      }
    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
