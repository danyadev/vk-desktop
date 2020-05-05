<template>
  <div class="im_chat_container im_chat_viewer">
    <div class="header">
      <img src="~assets/im_back.svg" class="im_header_back" @click="close">
      <div class="im_chat_viewer_title">{{ l('im_messages_view') }}</div>
    </div>
    <div class="im_chat_wrap">
      <Scrolly class="messages_list_wrap" vclass="messages_list">
        <MessagesList
          :peer_id="peer_id"
          :peer="peer"
          :list="messages"
        />
      </Scrolly>
    </div>
  </div>
</template>

<script>
import store from 'js/store';

import Scrolly from '../UI/Scrolly.vue';
import MessagesList from './chat/MessagesList.vue';

export default {
  props: ['peer_id', 'peer', 'messages'],

  components: {
    Scrolly,
    MessagesList
  },

  setup() {
    function close() {
      store.commit('messages/setViewerMessages', []);
    }

    return {
      close
    };
  }
}
</script>

<style>
.im_chat_viewer {
  position: absolute;
  height: 100%;
  top: 0;
  background: var(--background);
  /* Скрываем дату из списка ниже, потому что у .im_top_time z-index: 2 */
  z-index: 3;
}

.im_chat_viewer .header {
  color: var(--blue-background-text);
}

.im_chat_viewer .im_header_back {
  display: block;
}

.im_chat_viewer_title {
  padding-left: 10px;
}
</style>
