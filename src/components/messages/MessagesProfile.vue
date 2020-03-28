<template>
  <Ripple color="var(--messages-peer-ripple)" class="im_peer im_peer_profile">
    <img
      :src="photo"
      class="im_peer_photo"
      loading="lazy"
      width="50" height="50"
    >

    <div class="im_peer_content">
      <div class="im_peer_title">
        <div :class="['im_peer_name text-overflow', { blueName }]">
          <VKText>{{ chatName }}</VKText>
        </div>
        <Icon v-if="owner && owner.verified" name="verified" class="verified" />
        <div v-if="peer.muted" class="im_peer_muted"></div>
      </div>
      <div :class="['im_peer_online', { active: isOnline }]">{{ onlineText }}</div>
    </div>
  </Ripple>
</template>

<script>
import { reactive, computed } from 'vue';
import { getPhoto } from 'js/utils';
import { getPeerOnline } from 'js/messages';
import store from 'js/store';

import VKText from '../UI/VKText.vue';
import Ripple from '../UI/Ripple.vue';
import Icon from '../UI/Icon.vue';

export default {
  props: ['peer'],

  components: {
    VKText,
    Ripple,
    Icon
  },

  setup(props) {
    const state = reactive({
      isChat: computed(() => props.peer.id > 2e9),
      profiles: computed(() => store.state.profiles),
      owner: computed(() => state.profiles[props.peer.id]),
      blueName: computed(() => [100, 101, 333].includes(Number(props.peer.id))),

      photo: computed(() => {
        if (state.isChat) {
          return !props.peer.left && props.peer.photo || 'assets/im_chat_photo.png';
        } else {
          return getPhoto(state.owner) || 'assets/blank.gif';
        }
      }),

      chatName: computed(() => {
        if (state.isChat) {
          return props.peer.title;
        } else {
          return state.owner.name || `${state.owner.first_name} ${state.owner.last_name}`;
        }
      }),

      isOnline: computed(() => state.owner && state.owner.online),
      onlineText: computed(() => getPeerOnline(props.peer, state.owner))
    });

    return state;
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
  color: var(--blue-background);
}
</style>
