import Vue from 'vue';

export default {
  state: {
    // Все беседы, которые были загружены в приложение
    conversations: {},
    // Беседы, которые отображаются в списке бесед
    peersList: []
  },
  mutations: {
    addPeer(state, data) {
      Vue.set(state.conversations, data.peer.id, data);
      state.peersList.push(data.peer.id);
    },
    updatePeer(state, peer) {

    }
  },
  getters: {
    peersList(state) {
      return state.peersList.map((id) => {
        return state.conversations[id].peer;
      });
    },
    lastMessage: (state, getters) => (peerID) => {
      const peer = state.conversations[peerID];

      return peer && peer.lastMsg;
    },
  }
}
