<template>
  <div
    :id="'id' + msg.id"
    :class="['message', {
      isUnread,
      out: msg.out,
      isLoading: msg.isLoading,
      isDisappearing: msg.expireTtl && !msg.isExpired
    }]"
  >
    <div class="message_bubble_pre_wrap">
      <div class="message_bubble_wrap" :data-time="expireTime">
        <SendMsgErrorMenu v-if="msg.isLoading" :msg="msg" />

        <div class="message_bubble">
          <!-- reply -->

          <div v-if="msg.isContentDeleted" class="message_text isContentDeleted">
            {{ l(msg.isExpired ? 'is_message_expired' : 'im_attachment_deleted') }}
          </div>
          <div v-else class="message_text">
            <VKText :inline="false" link mention>{{ msg.text }}</VKText>
          </div>

          <!-- attachments -->
          <!-- forwarded -->

          <div class="message_time_wrap">
            <template v-if="msg.editTime">
              <div class="message_edited">{{ l('im_msg_edited') }}</div>
              <div class="message_dot"></div>
            </template>

            <div class="message_time">{{ time }}</div>
          </div>
        </div>

        <Keyboard v-if="msg.keyboard" :peer_id="peer_id" :keyboard="msg.keyboard" />
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed } from 'vue';
import { getTime } from 'js/date';
import { format } from 'js/date/utils';

import VKText from '../../UI/VKText.vue';
import Keyboard from './Keyboard.vue';
import SendMsgErrorMenu from './SendMsgErrorMenu.vue';

export default {
  props: ['peer_id', 'peer', 'msg'],

  components: {
    VKText,
    Keyboard,
    SendMsgErrorMenu
  },

  setup(props) {
    const state = reactive({
      time: computed(() => getTime(new Date(props.msg.date * 1000))),
      expireTime: '',

      isUnread: computed(() => {
        return props.peer && (
          props.msg.id > props.peer.out_read || // не прочитано собеседником
          props.msg.id > props.peer.in_read // не прочитано мной
        ) || props.msg.isLoading;
      })
    });

    if (props.msg.expireTtl) {
      const expireDate = new Date();
      const getElapsedTime = () => Math.ceil((Date.now() - props.msg.date * 1000) / 1000);
      let secs = props.msg.expireTtl - getElapsedTime();

      void function updateDate() {
        expireDate.setHours(0, 0, secs, 0);

        // Это уменьшит количество потерянных секунд
        secs = props.msg.expireTtl - getElapsedTime();

        if (secs) {
          state.expireTime = format(expireDate, 'mm:ss');
          setTimeout(updateDate, 1000);
        }
      }();
    }

    return state;
  }
};
</script>

<style>
.message {
  display: flex;
  background-color: var(--background);
  user-select: text;
}

.message:not(:first-child) {
  padding-top: 8px;
}

.message.out {
  justify-content: flex-end;
}

.message[active]:not(.hideBubble) .message_bubble {
  background-color: var(--message-out-bubble-background);
}

.message[active]:not(.hideBubble).out .message_bubble {
  background-color: var(--message-bubble-background);
}

.message_bubble_pre_wrap {
  max-width: 75%;
}

.message_bubble_wrap {
  position: relative;
  max-width: 600px;
  display: flex;
  flex-direction: column;
}

.message_bubble {
  position: relative;
  transition: background-color .5s;
}

.message:not(.hideBubble) .message_bubble {
  background-color: var(--message-bubble-background);
  padding: 8px 12px 9px 12px;
  border-radius: 18px;
  word-break: break-word;
}

.message:not(.hideBubble).out .message_bubble {
  background-color: var(--message-out-bubble-background);
}

.message_text {
  display: inline;
  line-height: 18px;
  user-select: text;
}

.message_text.isContentDeleted {
  color: var(--text-dark-steel-gray);
}

.message_text .link {
  display: inline;
}

.message_time_wrap {
  position: relative;
  display: flex;
  float: right;
  color: var(--text-dark-steel-gray);
  font-weight: 500;
  font-size: 11px;
  line-height: 13px;
  pointer-events: none;
  user-select: none;
}

.message:not(.hideBubble) .message_time_wrap {
  bottom: -5px;
  margin: 5px 0 0 6px;
}

.message_edited {
  margin-top: -1px;
}

.message_dot {
  width: 2px;
  height: 2px;
  margin: 6px 3px 0 3px;
  border-radius: 50%;
  background-color: var(--text-dark-steel-gray);
}

.message.isUnread .message_bubble::before,
.message.isUnread .message_bubble::after {
  position: absolute;
  width: 8px;
  height: 8px;
  bottom: 12px;
  border-radius: 50%;
  background-color: var(--blue-background-overlight);
}

.message:not(.isLoading).isUnread.out .message_bubble::before {
  content: '';
  left: -16px;
}

.message:not(.isLoading).isUnread.out.isDisappearing .message_bubble::before {
  left: -47px;
}

.message.isUnread:not(.out) .message_bubble::after {
  content: '';
  right: -16px;
}

.message.isUnread:not(.out).isDisappearing .message_bubble::after {
  right: -47px;
}

.message.isDisappearing .message_bubble_wrap::before,
.message.isDisappearing .message_bubble_wrap::after {
  position: absolute;
  z-index: 1;
  background: var(--background);
  border-radius: 9px;
  padding: 2px 5px;
  border: 1px solid var(--steel-gray-background-light);
  bottom: 1px;
  color: var(--text-dark-steel-gray);
  font-weight: 500;
  font-size: 11px;
}

.message:not(.isLoading).isDisappearing.out .message_bubble_wrap::before {
  content: attr(data-time);
  left: -31px;
}

.message.isDisappearing:not(.out) .message_bubble_wrap::after {
  content: attr(data-time);
  right: -31px;
}
</style>
