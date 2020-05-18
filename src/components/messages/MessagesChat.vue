<template>
  <div class="im_chat_container">
    <Header :peer_id="peer_id" :peer="peer" @close="closeChat" @search="isSearch = true" />
    <div :class="['im_chat_wrap', { pinnedMsg }]">
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

    <Transition name="fade-out">
      <MessagesChatSearch
        v-if="isSearch"
        :peer_id="peer_id"
        :peer="peer"
        @close="isSearch = false"
      />
    </Transition>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted } from 'vue';
import { loadConversation, loadConversationMembers } from 'js/messages';
import { eventBus } from 'js/utils';
import store from 'js/store';
import router from 'js/router';

import MessagesChatViewer from './MessagesChatViewer.vue';
import MessagesChatSearch from './MessagesChatSearch.vue';
import Header from './chat/Header.vue';
import List from './chat/List.vue';
import Input from './chat/Input.vue';

export default {
  components: {
    MessagesChatViewer,
    MessagesChatSearch,
    Header,
    List,
    Input
  },

  setup() {
    const state = reactive({
      peer_id: +router.currentRoute.value.params.id,
      viewer: computed(() => store.state.messages.viewer),

      isSearch: computed({
        get: () => store.state.messages.isMessagesSearch,
        set: (value) => (store.state.messages.isMessagesSearch = value)
      }),

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

    function closeChat() {
      eventBus.emit('messages:event', 'closeChat', {
        peer_id: state.peer_id
      });

      router.replace('/messages');
    }

    onMounted(() => {
      if (state.peer_id > 2e9) {
        loadConversationMembers(state.peer_id, true);
      }

      store.commit('messages/updatePeerConfig', {
        peer_id: state.peer_id,
        opened: true
      });

      // TODO перенести в onActivated
      if (!state.peer || !state.peer.loaded || state.peer_id < 2e9) {
        loadConversation(state.peer_id);
      }
    });

    return {
      ...toRefs(state),
      closeChat
    };
  }
};
</script>

<style>
.im_chat_wrap {
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
}

.im_chat_wrap.pinnedMsg {
  height: calc(100% - 50px - 52px);
}
</style>
