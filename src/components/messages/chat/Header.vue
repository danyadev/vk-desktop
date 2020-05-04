<template>
  <div class="header_wrap">
    <div class="header">
      <img src="~assets/im_back.svg" class="im_header_back" @click="$emit('close')">
      <img class="im_header_photo" :src="photo">

      <div class="im_header_center text-overflow">
        <div class="im_header_name_wrap">
          <div class="im_header_name text-overflow">
            <VKText>{{ title }}</VKText>
          </div>
          <Icon v-if="owner && owner.verified" name="verified" class="verified white" />
          <Icon
            v-if="peer && peer.isCasperChat"
            name="ghost"
            color="var(--blue-background-text)"
            class="im_header_ghost"
          />
          <Icon
            v-if="peer && peer.muted"
            name="muted"
            color="var(--blue-background-text)"
            class="im_header_muted"
          />
        </div>

        <Typing v-if="hasTyping" :peer_id="peer_id" :isChat="true" />
        <div v-else class="im_header_online text-overflow">{{ online }}</div>
      </div>
    </div>

    <PinnedMessage v-if="peer && peer.pinnedMsg" :msg="peer.pinnedMsg" :peer_id="peer_id" />
  </div>
</template>

<script>
import { reactive, computed } from 'vue';
import { getPeerAvatar, getPeerTitle, getPeerOnline } from 'js/messages';
import store from 'js/store';

import Icon from '../../UI/Icon.vue';
import VKText from '../../UI/VKText.vue';
import PinnedMessage from './PinnedMessage.vue';
import Typing from '../Typing.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Icon,
    VKText,
    PinnedMessage,
    Typing
  },

  setup(props) {
    const state = reactive({
      owner: computed(() => store.state.profiles[props.peer_id]),
      photo: computed(() => getPeerAvatar(props.peer_id, props.peer, state.owner)),
      title: computed(() => getPeerTitle(props.peer_id, props.peer, state.owner)),
      online: computed(() => getPeerOnline(props.peer_id, props.peer, state.owner)),
      hasTyping: computed(() => {
        const typing = store.state.messages.typing[props.peer_id] || {};
        return !!Object.keys(typing).length;
      })
    });

    return state;
  }
};
</script>

<style>
.im_header_back {
  display: none;
  flex: none;
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  opacity: .7;
  transition: opacity .3s;
}

.im_header_back:hover {
  opacity: 1;
}

.im_header_photo {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  margin: 0 5px 0 5px;
}

.im_header_center {
  flex-grow: 1;
}

.im_header_name_wrap {
  display: flex;
  justify-content: center;
  height: 16px;
}

.im_header_name_wrap .verified {
  flex: none;
  margin: 0 0 0 4px;
}

.im_header_ghost {
  opacity: .7;
  margin: -1px 0 0 3px;
}

.im_header_muted {
  opacity: .7;
  width: 14px;
  height: 16px;
  margin-left: 3px;
}

.im_header_name {
  color: var(--blue-background-text);
  line-height: 14px;
}

.im_header_online:not(:empty) {
  color: var(--blue-background-text-alpha);
  font-size: 13px;
  text-align: center;
  margin-top: 2px;
}
</style>
