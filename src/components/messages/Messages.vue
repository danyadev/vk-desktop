<template>
  <div
    :class="['section_container messages_container', settingsClasses, { hasChat }]"
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

      settings: computed(() => store.state.settings.userSettings[store.state.users.activeUserID]),
      settingsClasses: computed(() => (
        ['showAvatarAtBottom', 'useLightMessageColors']
          .map((name) => state.settings[name] && `st-${name}`)
      ))
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

@media screen and (max-width: 719px) {
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

@media screen and (min-width: 720px) and (max-width: 850px) {
  .im_peers_container { width: 44% }
  .messages_container > .im_chat_container { width: 56% }
}

@media screen and (min-width: 851px) {
  /* 790px = 850px - 60px (ширина левого меню) */
  .im_peers_container { width: calc(790px * .44) }
  .messages_container > .im_chat_container { width: calc(100% - 790px * .44) }
}

@media screen and (min-width: 720px) {
  .menu.bottom {
    display: none;
  }

  .im_peers_container .account_manager {
    display: none;
  }
}
</style>
