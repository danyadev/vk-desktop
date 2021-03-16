<template>
  <div class="im_chat_container im_search_container">
    <div class="header border-bottom-shadow">
      <Icon
        name="im_back"
        color="var(--icon-blue)"
        width="24"
        height="26"
        class="im_header_back"
        @click="close"
      />
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
import { computed } from 'vue';
import store from 'js/store';

import Icon from '../UI/Icon.vue';
import Scrolly from '../UI/Scrolly.vue';
import MessagesList from './chat/MessagesList.vue';

export default {
  props: ['peer_id', 'messages'],

  components: {
    Icon,
    Scrolly,
    MessagesList
  },

  setup(props) {
    const peer = computed(() => store.state.messages.conversations[props.peer_id].peer);

    function close() {
      store.commit('messages/closeMessagesViewer');
    }

    return {
      peer,
      close
    };
  }
};
</script>

<style>
.im_search_container .header {
  box-sizing: content-box;
}

.im_chat_viewer_title {
  padding-left: 10px;
  color: var(--text-light-blue);
}

/* Здесь снимается ограничение на ширину сообщения, потому что здесь */
/* может отображаться большой список вложенных пересланных сообщений */

.im_search_container .attach_forwarded {
  width: max-content;
}

.im_search_container .message.fwdOverflow .message_bubble_pre_wrap,
.im_search_container .message.fwdOverflow .message_bubble_wrap {
  max-width: initial;
}

.im_search_container .message.fwdOverflow {
  justify-content: initial;
}

.im_search_container .message.fwdOverflow .message_bubble {
  margin-right: 35px;
}
</style>
