<template>
  <div class="header_wrap border-bottom-shadow">
    <div v-if="!selectedMessages.length" class="header">
      <Icon
        name="im_back"
        color="var(--icon-blue)"
        width="24"
        height="26"
        class="im_header_back"
        @click="$emit('close')"
      />
      <img class="im_header_photo" :src="photo">

      <div class="im_header_center text-overflow">
        <div class="im_header_name_wrap">
          <div class="im_header_name text-overflow">
            <VKText>{{ title }}</VKText>
          </div>
          <Icon v-if="owner && owner.verified" name="verified" class="verified" />
          <Icon
            v-if="peer && peer.isCasperChat"
            name="ghost"
            color="var(--icon-dark-blue)"
            class="im_header_ghost"
          />
          <Icon v-if="peer.isDonut" name="donut_fill_20" class="im_header_donut" />
          <Icon
            v-if="peer && peer.muted"
            name="muted"
            color="var(--icon-gray)"
            class="im_header_muted"
          />
        </div>

        <Typing v-if="hasTyping" :peer_id="peer_id" :isChat="true" />
        <div v-else class="im_header_online text-overflow">{{ online }}</div>
      </div>

      <Icon
        name="search"
        color="var(--icon-blue)"
        class="im_search_btn"
      />
      <MessagesChatMenu :peer_id="peer_id" :peer="peer" />
    </div>
    <HeaderMessagesToolbar v-else :peer_id="peer_id" :peer="peer" :messages="selectedMessages" />

    <PinnedMessage v-if="peer && peer.pinnedMsg" :msg="peer.pinnedMsg" :peer_id="peer_id" />
  </div>
</template>

<script>
import { reactive, computed } from 'vue';
import { getPeerAvatar, getPeerTitle, getPeerOnline } from 'js/api/messages';
import store from 'js/store';

import Typing from '../Typing.vue';
import HeaderMessagesToolbar from './HeaderMessagesToolbar.vue';
import PinnedMessage from './PinnedMessage.vue';
import Icon from '@/UI/Icon.vue';
import VKText from '@/UI/VKText.vue';
import MessagesChatMenu from '@/ActionMenus/MessagesChatMenu.vue';

export default {
  props: ['peer_id', 'peer'],
  emits: ['close'],

  components: {
    Icon,
    VKText,
    Typing,
    MessagesChatMenu,
    HeaderMessagesToolbar,
    PinnedMessage
  },

  setup(props) {
    const state = reactive({
      owner: computed(() => store.state.profiles[props.peer_id]),
      photo: computed(() => getPeerAvatar(props.peer_id, props.peer, state.owner)),
      title: computed(() => getPeerTitle(props.peer_id, props.peer, state.owner)),
      online: computed(() => getPeerOnline(props.peer_id, props.peer, state.owner)),
      selectedMessages: computed(() => store.state.messages.selectedMessages),

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
  margin: 0 -2px 0 10px;
  cursor: pointer;
}

.im_header_photo {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  margin: 0 10px;
  background: white;
}

.im_header_center {
  flex-grow: 1;
}

.im_header_name_wrap {
  display: flex;
  height: 16px;
  line-height: 15px;
  margin: 2px 0 1px 0;
}

.im_header_name_wrap .verified {
  flex: none;
  margin: 1px 0 0 4px;
}

.im_header_ghost {
  margin: -1px 0 0 3px;
}

.im_header_donut {
  flex: none;
  width: 13px;
  height: 13px;
  margin: 2px 0 0 4px;
}

.im_header_muted {
  opacity: .8;
  width: 13px;
  height: 13px;
  margin: 2px 0 0 4px;
}

.im_header_online:not(:empty) {
  color: var(--text-dark-steel-gray);
  font-size: 14px;
}

.im_search_btn {
  flex: none;
  box-sizing: content-box;
  padding: 0 5px;
}
</style>
