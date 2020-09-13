<template>
  <div
    :class="['section_container messages_container', { hasChat }]"
    tabindex="-1"
    @keydown.esc="closeChat"
  >
    <MessagesPeers :activeChat="peer_id" />

    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" :key="`${route.name}${peer_id}`" />
      </KeepAlive>
    </RouterView>
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
      peer_id: computed(() => +state.route.params.id || 0),
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
        return router.replace(`/messages/${state.route.params.fromId}`);
      }

      eventBus.emit('messages:event', 'closeChat', {
        peer_id: state.peer_id
      });

      router.replace('/messages');
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

@media screen and (max-width: 699px) {
  .menu.left {
    display: none !important;
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

@media screen and (min-width: 700px) and (max-width: 850px) {
  .im_peers_container { width: 43% }
  .im_chat_container { width: 57% }
}

@media screen and (min-width: 851px) {
  /* 785px = 850px - 65px (ширина левого меню) */
  .im_peers_container { width: calc(785px * 0.43) }
  .im_chat_container { width: calc(100% - 785px * 0.43) }
}

@media screen and (min-width: 700px) {
  .menu.bottom {
    display: none;
  }
}
</style>
