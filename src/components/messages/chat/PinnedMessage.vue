<template>
  <div v-if="!isHidden" class="im_pinned_msg_wrap" @click="openMessage">
    <Icon name="pin" color="var(--icon-dark-gray)" class="im_pinned_msg_icon" />

    <div class="im_pinned_msg">
      <div class="im_pinned_msg_name_wrap text-overflow">
        <div class="im_pinned_msg_name">{{ name }}</div>
        <div class="im_pinned_msg_time">{{ time }}</div>
      </div>
      <div :class="['im_pinned_msg_text text-overflow', { isAttachment }]">
        <ServiceMessage
          v-if="msg.action"
          :msg="msg"
          :author="author"
          :peer_id="peer_id"
        />
        <VKText v-else mention>{{ text }}</VKText>
      </div>
    </div>

    <Icon
      name="close"
      color="var(--icon-dark-gray)"
      class="im_pinned_msg_close icon-hover"
      @click.stop="hideMessage"
    />
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { getMessagePreview, getPeerTitle } from 'js/messages';
import { eventBus } from 'js/utils';
import { getFullDate } from 'js/date';
import store from 'js/store';

import Icon from '../../UI/Icon.vue';
import VKText from '../../UI/VKText.vue';
import ServiceMessage from '../ServiceMessage.vue';

export default {
  props: ['msg', 'peer_id'],

  components: {
    Icon,
    VKText,
    ServiceMessage
  },

  setup(props) {
    const state = reactive({
      settings: computed(() => store.getters['settings/settings']),
      isHidden: computed(() => state.settings.hiddenPinnedMessages[props.peer_id]),
      author: computed(() => store.state.profiles[props.msg.from]),
      name: computed(() => getPeerTitle(0, null, state.author)),
      time: computed(() => getFullDate(new Date(props.msg.date * 1000))),
      text: computed(() => getMessagePreview(props.msg)),
      isAttachment: computed(() => props.msg.hasAttachment && !props.msg.text && !props.msg.action)
    });

    function openMessage() {
      if (props.msg.id) {
        eventBus.emit('messages:event', 'jump', {
          peer_id: props.peer_id,
          msg_id: props.msg.id,
          mark: true
        });
      } else {
        store.commit('messages/openMessagesViewer', {
          messages: [props.msg],
          peer_id: props.peer_id
        });
      }
    }

    function hideMessage() {
      const list = { ...state.settings.hiddenPinnedMessages };
      list[props.peer_id] = true;

      store.commit('settings/updateUserSettings', {
        hiddenPinnedMessages: list
      });
    }

    return {
      ...toRefs(state),
      openMessage,
      hideMessage
    };
  }
};
</script>

<style>
.im_pinned_msg_wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  border-bottom: 1px solid var(--separator-dark);
  background: var(--background);
  cursor: pointer;
}

.im_pinned_msg_wrap::after {
  content: '';
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 1;
  height: 4px;
  margin-top: 1px;
  pointer-events: none;
  background: linear-gradient(0deg, transparent, rgba(0, 0, 0, .03) 75%, rgba(0, 0, 0, .06));
}

.im_pinned_msg_icon {
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0 20px;
}

.im_pinned_msg {
  flex-grow: 1;
  width: calc(100% - 60px - 56px);
}

.im_pinned_msg_name {
  display: inline;
  color: var(--text-blue);
  font-weight: 500;
}

.im_pinned_msg_time {
  display: inline;
  margin-left: 5px;
  color: var(--text-steel-gray);
  font-size: 13px;
}

.im_pinned_msg_text.isAttachment {
  color: var(--text-blue);
}

.im_pinned_msg_close {
  box-sizing: content-box;
  flex: none;
  width: 16px;
  height: 16px;
  padding: 16px 20px;
}
</style>
