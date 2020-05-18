<template>
  <div :class="['messages_container', { hasChat }]" tabindex="-1" @keydown.esc="closeChat">
    <MessagesPeers :activeChat="peer_id" />
    <!-- TODO(vue-router) :key="peer_id" + KeepAlive -->
    <RouterView />
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { eventBus } from 'js/utils';
import router from 'js/router';
import store from 'js/store';

import MessagesPeers from './MessagesPeers.vue';

export default {
  components: {
    MessagesPeers
  },

  setup() {
    const state = reactive({
      route: router.currentRoute,
      peer_id: computed(() => state.route.params.id),
      hasChat: computed(() => state.route.name === 'chat')
    });

    function closeChat() {
      if (store.state.messages.isMessagesSearch) {
        return (store.state.messages.isMessagesSearch = false);
      }

      if (store.state.messages.selectedMessages.length) {
        return store.commit('messages/removeSelectedMessages');
      }

      if (store.state.messages.viewer.messages.length) {
        return store.commit('messages/closeMessagesViewer');
      }

      if (state.route.name === 'forward-to') {
        router.replace(`/messages/${state.route.params.fromId}`);
      } else {
        eventBus.emit('messages:event', 'closeChat', {
          peer_id: state.peer_id
        });

        router.replace('/messages');
      }
    }

    return {
      ...toRefs(state),
      closeChat
    };
  }
};
</script>

<style>
.messages_container {
  display: flex;
  height: 100%;
}

@media screen and (max-width: 649px) {
  .im_peers_container { width: 100% }
  .im_peers_wrap { border-right: none }

  .messages_container:not(.hasChat) .im_chat_container { display: none }
  .messages_container.hasChat .im_chat_container { width: 100% }

  .messages_container.hasChat .im_peers_container { display: none }
  .messages_container.hasChat .im_header_back { display: block }
}

@media screen and (min-width: 650px) and (max-width: 899px) {
  .im_peers_container { width: 42% }
  .im_chat_container { width: 58% }
}

@media screen and (min-width: 900px) {
  .im_peers_container { width: 378px }
  .im_chat_container { width: calc(100% - 378px) }
}
</style>
