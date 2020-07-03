<template>
  <div
    :class="['section_container messages_container', { hasChat }]"
    tabindex="-1"
    @keydown.esc="closeChat"
  >
    <MessagesPeers :activeChat="peer_id" />
    <!-- TODO(vue-router) :key="peer_id" + KeepAlive -->
    <RouterView />
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { eventBus } from 'js/utils';
import store from 'js/store';
import router from 'js/router';

import MessagesPeers from './MessagesPeers.vue';

export default {
  components: {
    MessagesPeers
  },

  setup() {
    const state = reactive({
      route: router.currentRoute,
      peer_id: computed(() => +state.route.params.id),
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
}

@media screen and (max-width: 669px) {
  .menu.left {
    display: none !important;
  }

  .section_container {
    width: 100% !important;
  }

  .im_peers_container {
    width: 100%;
    border-right: none;
  }

  .messages_container:not(.hasChat) .im_chat_container { display: none }
  .messages_container.hasChat .im_chat_container { width: 100% }

  .messages_container.hasChat .im_peers_container { display: none }
  .messages_container.hasChat .im_header_back { display: block }
}

@media screen and (min-width: 670px) and (max-width: 840px) {
  .im_peers_container { width: 48% }
  .im_chat_container { width: 54% }
}

@media screen and (min-width: 841px) {
  .im_peers_container { width: 371px }
  .im_chat_container { width: calc(100% - 371px) }
}

@media screen and (min-width: 670px) {
  .menu.bottom {
    display: none;
  }
}
</style>
