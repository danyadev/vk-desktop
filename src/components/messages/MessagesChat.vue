<template>
  <div class="im_chat_container">
    <Header :peer_id="peer_id" :peer="peer" @close="$router.replace('/messages')" />
    <div class="im_chat_wrap">
      <List :peer_id="peer_id" :peer="peer" />
      <Input :peer_id="peer_id" :peer="peer" />
    </div>

    <Transition name="fade-out">
      <MessagesChatViewer
        v-if="viewer.messages.length"
        :peer_id="viewer.peer_id"
        :messages="viewer.messages"
      />
    </Transition>
  </div>
</template>

<script>
import { reactive, computed, onMounted, onActivated } from 'vue';
import { loadConversation, loadConversationMembers } from 'js/messages';
import store from 'js/store';
import router from 'js/router';

import MessagesChatViewer from './MessagesChatViewer.vue';
import Header from './chat/Header.vue';
import List from './chat/List.vue';
import Input from './chat/Input.vue';

export default {
  components: {
    MessagesChatViewer,
    Header,
    List,
    Input
  },

  setup() {
    const state = reactive({
      // Здесь не нужен computed, потому что MessagesChat создается отдельно для каждой беседы
      // и сохраняется с помощью KeepAlive
      peer_id: +router.currentRoute.value.params.id,
      viewer: computed(() => store.state.messages.viewer),

      peer: computed(() => {
        const conversation = store.state.messages.conversations[state.peer_id];
        return conversation && conversation.peer;
      }),

      pinnedMsg: computed(() => {
        if (state.peer && state.peer.pinnedMsg) {
          return !store.getters['settings/settings'].hiddenPinnedMessages[state.peer_id];
        }
      })
    });

    onMounted(() => {
      if (state.peer_id > 2e9) {
        loadConversationMembers(state.peer_id, true);
      }

      store.commit('messages/updatePeerConfig', {
        peer_id: state.peer_id,
        wasOpened: true
      });
    });

    onActivated(() => {
      if (!state.peer || !state.peer.loaded || state.peer_id < 2e9) {
        loadConversation(state.peer_id);
      }
    });

    return state;
  }
};
</script>

<style>
.im_chat_container {
  display: flex;
  flex-direction: column;
}

.im_chat_wrap {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
}
</style>
