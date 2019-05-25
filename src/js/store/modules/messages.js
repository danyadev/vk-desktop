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
        state.peersList.push(conversation.peer.id);
      }
    },

    updateConversation(state, { peer, msg = {} }) {
      const conv = { ...state.conversations[peer.id] || {} };
      conv.peer = Object.assign({}, conv.peer, peer);
      conv.msg = Object.assign({}, conv.msg, msg);

      Vue.set(state.conversations, peer.id, conv);
    },

    addMessages(state, { peer_id, messages, addNew }) {
      const oldMsgs = state.messages[peer_id] || [];
      const newMsgs = messages.filter(({ id }) => {
        return oldMsgs.findIndex((msg) => msg.id == id) == -1
      });

      const newList = addNew ? [...oldMsgs, ...newMsgs] : [...newMsgs, ...oldMsgs];

      Vue.set(state.messages, peer_id, newList);
    },

    moveConversation(state, { peer_id, moveUp }) {
      const index = state.peersList.indexOf(peer_id);
      if(index == -1) return;

      if(moveUp) { // Переместить беседу в самый верх списка
        moveArrItem(state.peersList, index, 0);
      } else { // Самому посчитать положение беседы
        // TODO удаление и восстановление сообщений
      }
    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
