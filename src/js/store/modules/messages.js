import Vue from 'vue';

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
      for(let conversation of conversations) {
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
      const oldMessages = state.messages[peer_id] || [];
      const newMessages = addNew ? [...oldMessages, ...messages] : [...messages, ...oldMessages];

      Vue.set(state.messages, peer_id, newMessages);
    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
