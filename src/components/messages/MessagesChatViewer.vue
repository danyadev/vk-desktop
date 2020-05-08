<template>
  <div class="im_chat_container im_search_container">
    <div class="header">
      <img src="~assets/im_back.svg" class="header_btn im_header_back" @click="close">
      <div class="im_chat_viewer_title">{{ l('im_messages_view') }}</div>
    </div>
    <div class="im_chat_wrap">
      <Scrolly class="messages_list_wrap" vclass="messages_list">
        <MessagesList
          :peer_id="peer_id"
          :peer="peer"
          :list="messages"
          :isCustomView="true"
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
};
</script>

<style>
.im_chat_viewer_title {
  padding-left: 10px;
}
</style>
