import Vue from 'vue';

function getState() {
  return {
    // Все беседы, которые были загружены в приложение
    conversations: {},
    // Беседы, которые отображаются в списке бесед
    peersList: []
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

    }
  },
  getters: {
    conversationsList(state) {
      return state.peersList.map((id) => state.conversations[id]);
    }
  }
}
