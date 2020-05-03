<template>
  <div :class="['message', { isUnread, out: msg.out }]">
    <div class="message_bubble_pre_wrap">
      <div class="message_bubble_wrap">
        <!-- error menu -->

        <div class="message_bubble">
          <!-- reply -->

          <div v-if="msg.isContentDeleted" class="message_text isContentDeleted">
            {{ l('im_attachment_deleted') }}
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

        <!-- inline keyboard -->
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed } from 'vue';
import { getTime } from 'js/date';

import VKText from '../../UI/VKText.vue';

export default {
  props: ['peer_id', 'peer', 'msg'],

  components: {
    VKText
  },

  setup(props) {
    const state = reactive({
      time: computed(() => getTime(new Date(props.msg.date * 1000))),

      isUnread: computed(() => {
        return props.peer && (
          props.msg.id > props.peer.out_read || // не прочитано собеседником
          props.msg.id > props.peer.in_read // не прочитано мной
        ) || props.msg.isLoading;
      })
    });

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

.message.isUnread:not(.out) .message_bubble::after {
  content: '';
  right: -16px;
}
</style>
