<template>
  <div class="im_peer im_peer_profile" @click="openChat">
    <img
      :src="photo"
      class="im_peer_photo"
      loading="lazy"
      width="50"
      height="50"
    >

    <div class="im_peer_content">
      <div class="im_peer_title">
        <div :class="['im_peer_name text-overflow', { blueName }]">
          <VKText>{{ chatName }}</VKText>
        </div>
        <Icon v-if="owner && owner.verified" name="verified" class="verified" />
        <Icon
          v-if="peer.isCasperChat"
          name="ghost"
          color="var(--background-blue)"
          class="im_peer_ghost"
        />
        <div v-if="peer.muted" class="im_peer_muted"></div>
      </div>
      <div :class="['im_peer_online', { active: isOnline }]">{{ onlineText }}</div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { getPeerAvatar, getPeerTitle, getPeerOnline } from 'js/messages';
import store from 'js/store';
import router from 'js/router';

import VKText from '../UI/VKText.vue';
import Icon from '../UI/Icon.vue';

export default {
  props: ['peer'],

  components: {
    VKText,
    Icon
  },

  setup(props, { emit }) {
    const state = reactive({
      isForwardTo: computed(() => router.currentRoute.value.name === 'forward-to'),
      isChat: computed(() => props.peer.id > 2e9),
      owner: computed(() => store.state.profiles[props.peer.id]),
      blueName: computed(() => [100, 101, 333].includes(Number(props.peer.id))),
      photo: computed(() => getPeerAvatar(props.peer.id, props.peer, state.owner)),
      chatName: computed(() => getPeerTitle(props.peer.id, props.peer, state.owner)),
      onlineText: computed(() => getPeerOnline(props.peer.id, props.peer, state.owner)),
      isOnline: computed(() => state.owner && state.owner.online)
    });

    function openChat() {
      if (state.isForwardTo) {
        if (props.peer.isChannel) {
          return;
        }

        store.state.messages.forwardedMessages[props.peer.id] = (
          store.state.messages.tmpForwardingMessages
        );

        store.state.messages.tmpForwardingMessages = [];

        emit('close');
      }

      router.replace(`/messages/${props.peer.id}`);
    }

    return {
      ...toRefs(state),
      openChat
    };
  }
};
</script>

<style>
.im_peer_profile .im_peer_title {
  font-weight: 500;
}

.im_peer_profile .im_peer_online {
  margin-top: 1px;
  color: var(--text-dark-steel-gray);
}

.im_peer_profile .im_peer_online.active {
  color: var(--text-blue-light);
}
</style>
