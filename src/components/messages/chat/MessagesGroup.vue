<template>
  <div class="messages_stack">
    <img
      v-if="showUserData"
      class="message_photo"
      :src="photo"
      loading="lazy"
      width="35"
      height="35"
    >

    <div class="messages_stack_list">
      <Message
        v-for="(msg, i) of messages"
        :key="msg.id"
        :peer_id="peer_id"
        :peer="peer"
        :msg="msg"
        :user="user"
        :showUserData="showUserData"
        :isFirstItem="!i"
        :isCustomView="isCustomView"
      />
    </div>
  </div>
</template>

<script>
import { computed, reactive } from 'vue';
import { getPhoto } from 'js/api/utils';
import store from 'js/store';

import Message from './Message.vue';

export default {
  props: ['peer_id', 'peer', 'messages', 'isCustomView'],

  components: {
    Message
  },

  setup(props) {
    const state = reactive({
      msg: computed(() => props.messages[0]),
      user: computed(() => store.state.profiles[state.msg.from]),
      photo: computed(() => getPhoto(state.user) || 'assets/blank.gif'),
      showUserData: computed(() => (
        !state.msg.out && props.peer_id > 2e9 && !(props.peer && props.peer.isChannel)
      ))
    });

    return state;
  }
};
</script>

<style>
.messages_stack {
  display: flex;
  padding: 8px 14px 4px 14px;
}

.message_photo {
  border-radius: 50%;
  width: 35px;
  height: 35px;
  margin-right: 10px;
  flex: none;
  position: sticky;
  top: 5px;
}

.st-showAvatarsAtBottom .message_photo {
  top: calc(100% - 10px - 5px);
}

.messages_stack_list {
  width: 100%;
}

/* Если есть ава, то отнимаем от общей ширины занимаемое пространство авы */
.message_photo + .messages_stack_list {
  width: calc(100% - 45px);
}
</style>
