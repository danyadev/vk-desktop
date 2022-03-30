<template>
  <div
    :class="['section_container messages_container', { hasChat, hasModals }]"
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
import { modalsState } from 'js/modals';
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
      hasChat: computed(() => state.route.name === 'chat'),
      hasModals: computed(() => modalsState.hasModals)
    });

    function closeChat() {
      if (store.state.messages.selectedMessages.length) {
        return store.commit('messages/removeSelectedMessages');
      }

      if (store.state.messages.viewer.messages.length) {
        return store.commit('messages/closeMessagesViewer');
      }

      if (state.route.name === 'forward-to') {
        return router.push(`/messages/${state.route.params.fromId}`);
      }

      router.back();
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
  .im_peers_container {
    width: 100%;
    border-right: none;
  }

  .messages_container:not(.hasChat) .im_chat_container { display: none }
  .messages_container.hasChat .im_chat_container { width: 100% }

  .messages_container.hasChat .im_peers_container { display: none }
  .messages_container.hasChat .im_header_back { display: block }
}

@media screen and (min-width: 700px) and (max-width: 880px) {
  .im_peers_container { width: 41% }
  .messages_container > .im_chat_container { width: 59% }
}

@media screen and (min-width: 881px) {
  .im_peers_container { width: calc(880px * .41) }
  .messages_container > .im_chat_container { width: calc(100% - 880px * .41) }
}
</style>
