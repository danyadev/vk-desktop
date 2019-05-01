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

    addPeer(state, data) {
      Vue.set(state.conversations, data.peer.id, data);
      state.peersList.push(data.peer.id);
    },
    updatePeer(state, peer) {
      const conv = { ...state.conversations[peer.id] || {} };
      conv.peer = Object.assign({}, conv.peer, peer);

      Vue.set(state.conversations, peer.id, conv);
    },

    addMessage(state, { peer_id, msg }) {
      const messages = [msg, ...state.messages[peer_id] || []];
      Vue.set(state.messages, peer_id, messages);
    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
