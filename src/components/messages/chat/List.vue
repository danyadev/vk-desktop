<template>
  <Scrolly
    class="messages_list_wrap"
    :vclass="['messages_list', { empty: !hasMessages }]"
  >
    <MessagesList
      :peer_id="peer_id"
      :peer="peer"
      :list="messagesWithLoading"
    />

    <div v-if="!hasMessages && !loadingUp && !loadingDown" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.webp">
      {{ l('im_empty_dialog') }}
    </div>
  </Scrolly>
</template>

<script>
import { reactive, computed } from 'vue';
import store from 'js/store';

import Scrolly from '../../UI/Scrolly.vue';
import MessagesList from './MessagesList.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Scrolly,
    MessagesList
  },

  setup(props) {
    const state = reactive({
      loadingUp: false,
      loadingDown: false,
      loadedUp: false,
      loadedDown: false,

      messages: computed(() => store.state.messages.messages[props.peer_id] || []),
      loadingMessages: computed(() => store.state.messages.loadingMessages[props.peer_id] || []),
      messagesWithLoading: computed(() => {
        return state.messages.concat(state.loadedDown ? state.loadingMessages : []);
      }),
      hasMessages: computed(() => state.messagesWithLoading.length)
    });

    return state;
  }
};
</script>

<style>
.messages_list_wrap, .messages_list {
  display: flex;
  flex-direction: column;
}

.messages_list_wrap {
  height: 100%;
}

.messages_list {
  padding-bottom: 25px;
}

.messages_list.empty {
  align-items: center;
  justify-content: center;
}

.messages_empty_dialog {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--text-dark-steel-gray);
}

.messages_empty_dialog img {
  height: 160px;
}
</style>
