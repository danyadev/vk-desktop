<template>
  <div class="messages_stack">
    <div v-if="showUserData" class="message_name">{{ name }}</div>

    <div class="messages_stack_content">
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
          v-for="msg of messages"
          :key="msg.id"
          :peer_id="peer_id"
          :peer="peer"
          :msg="msg"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive } from 'vue';
import { getPeerTitle } from 'js/messages';
import { getPhoto } from 'js/utils';
import store from 'js/store';

import Message from './Message.vue';

export default {
  props: ['peer_id', 'peer', 'messages'],

  components: {
    Message
  },

  setup(props) {
    const state = reactive({
      msg: computed(() => props.messages[0]),
      user: computed(() => store.state.profiles[state.msg.from]),
      name: computed(() => getPeerTitle(0, null, state.user)),
      photo: computed(() => getPhoto(state.user) || 'assets/blank.gif'),
      isChat: computed(() => props.peer_id > 2e9),
      isChannel: computed(() => props.peer && props.peer.isChannel),
      showUserData: computed(() => !state.msg.out && state.isChat && !state.isChannel)
    });

    return state;
  }
};
</script>

<style>
.messages_stack {
  padding: 8px 14px 4px 14px;
}

.message_name {
  color: var(--text-blue);
  font-weight: 500;
  margin-left: 50px;
  margin-bottom: 2px;
  user-select: none;
}

.messages_stack_content {
  display: flex;
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

.messages_stack_list {
  width: 100%;
}
</style>
