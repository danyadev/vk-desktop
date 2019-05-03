import Vue from 'vue';

function getState() {
  return {
    // Все беседы, которые были загружены в приложение
    conversations: {},
    // Беседы, которые отображаются в списке бесед
    peersList: [],

    // { peer_id: { messages[] }
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
    updatePeer(state, peer) {
      const conv = { ...state.conversations[peer.id] || {} };
      conv.peer = Object.assign({}, conv.peer, peer);

      Vue.set(state.conversations, peer.id, conv);
    },

    addMessages(state, { peer_id, messages }) {
      for(let msg of messages) {
        const msgs = [msg, ...state.messages[peer_id] || []];
        Vue.set(state.messages, peer_id, msgs);
      }
    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
