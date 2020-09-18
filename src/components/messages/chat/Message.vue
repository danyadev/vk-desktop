<template>
  <div
    :data-context-menu="!msg.isLoading && !isCustomView ? 'message' : null"
    :data-id="msg.id"
    :class="['message', ...attachmentClasses, {
      isUnread,
      out: msg.out,
      fwdOverflow,
      isLoading: msg.isLoading,
      isSelectMode,
      isSelected,

      isDisappearing: msg.expireTtl,
      expireIcon,
      expireHours
    }]"
  >
    <div class="message_bubble_pre_wrap">
      <div class="message_bubble_wrap">
        <MessageExpireTime
          v-if="msg.out && msg.expireTtl"
          :expireIcon="expireIcon"
          :msg="msg"
          @update="updateState"
        />

        <SendMsgErrorMenu v-if="msg.isLoading" :msg="msg" />

        <div ref="bubble" class="message_bubble" @mousedown="onMouseDown" @mouseup="onMouseMove">
          <div
            v-if="isFirstItem && showUserData && !attachmentClasses.includes('hideBubble')"
            class="message_name roboto-vk"
          >
            {{ name }}
          </div>

          <div class="message_bubble_content">
            <Reply
              v-if="msg.hasReplyMsg"
              :peer_id="peer_id"
              :msg="msg.replyMsg"
              :ownerMsgId="msg.id"
            />

            <div v-if="msg.isContentDeleted" class="message_text isContentDeleted">
              {{ l(msg.isExpired ? 'is_message_expired' : 'im_attachment_deleted') }}
            </div>
            <div v-else class="message_text roboto-vk">
              <VKText :inline="false" link mention="link">{{ msg.text }}</VKText>
            </div>

            <Attachments :msg="msg" />

            <Forwarded
              v-if="msg.fwdCount"
              ref="forwarded"
              :peer_id="peer_id"
              :msg="msg"
              :isCustomView="isCustomView"
              :fwdDepth="1"
            />

            <div class="message_time_wrap">
              <template v-if="msg.editTime">
                <div class="message_edited">{{ l('im_msg_edited') }}</div>
                <div class="message_dot"></div>
              </template>

              <div class="message_time">{{ time }}</div>
            </div>
          </div>

          <Keyboard
            v-if="msg.keyboard"
            :peer_id="peer_id"
            :keyboard="msg.keyboard"
            :msg_id="msg.id"
          />
        </div>

        <MessageExpireTime
          v-if="!msg.out && msg.expireTtl"
          :expireIcon="expireIcon"
          :msg="msg"
          @update="updateState"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted } from 'vue';
import { getPeerTitle } from 'js/messages';
import { getTime } from 'js/date';
import store from 'js/store';

import VKText from '../../UI/VKText.vue';
import Keyboard from './Keyboard.vue';
import SendMsgErrorMenu from './SendMsgErrorMenu.vue';
import MessageExpireTime from './MessageExpireTime.vue';
import Reply from './attachments/Reply.vue';
import Attachments from './attachments/Attachments.vue';
import Forwarded from './attachments/Forwarded.vue';

export default {
  props: ['peer_id', 'peer', 'msg', 'user', 'showUserData', 'isFirstItem', 'isCustomView'],

  components: {
    VKText,
    Keyboard,
    SendMsgErrorMenu,
    MessageExpireTime,
    Reply,
    Attachments,
    Forwarded
  },

  setup(props) {
    const state = reactive({
      bubble: null,
      forwarded: null,

      name: computed(() => getPeerTitle(0, null, props.user)),

      selectedMessages: computed(() => store.state.messages.selectedMessages),
      isSelected: computed(() => state.selectedMessages.includes(props.msg.id)),
      isSelectMode: computed(() => (
        !!state.selectedMessages.length
      )),

      expireIcon: !!props.msg.expireTtl, // Изначально true если сообщение фантомное
      expireHours: false,

      fwdOverflow: false,
      time: computed(() => getTime(new Date(props.msg.date * 1000))),
      isUnread: computed(() => (
        props.msg.isLoading ||
        props.peer && (
          props.msg.id > props.peer.out_read || // Не прочитано собеседником
          props.msg.id > props.peer.in_read // Не прочитано мной
        )
      )),

      attachmentClasses: computed(() => {
        const classes = [];
        let flyTime = false;

        const { text, attachments, hasReplyMsg, fwdCount } = props.msg;
        const { sticker } = attachments;
        const attachNames = Object.keys(attachments);

        if (attachNames.length || fwdCount) classes.push('hasAttachment');
        if (sticker) classes.push('isSticker');
        if (sticker) flyTime = true;

        if (sticker && !hasReplyMsg && !text) {
          classes.push('hideBubble');
          flyTime = true;
        }

        if (flyTime) classes.push('flyTime');
        if (fwdCount) classes.push('hasForward');

        return classes;
      })
    });

    let timer;

    function onMouseDown(event) {
      if (event.button !== 0 || props.isCustomView || props.msg.attachments.call) {
        return;
      }

      if (state.isSelected) {
        return store.commit('messages/removeSelectedMessage', props.msg.id);
      }

      if (!state.isSelectMode) {
        timer = setTimeout(() => {
          store.commit('messages/addSelectedMessage', props.msg.id);
          state.bubble.removeEventListener('mousemove', onMouseMove);
        }, 500);

        state.bubble.addEventListener('mousemove', onMouseMove);

        return;
      }

      if (!event.shiftKey) {
        return store.commit('messages/addSelectedMessage', props.msg.id);
      }

      // Обработка shift + клик
      const lastSelectedId = state.selectedMessages[state.selectedMessages.length - 1];
      const messages = store.state.messages.messages[props.peer_id];

      const lastSelectedIndex = messages.findIndex((msg) => msg.id === lastSelectedId);
      const msgIndex = messages.findIndex((msg) => props.msg.id === msg.id);

      if (lastSelectedIndex === -1) {
        // Сообщения нет в списке, т.к. юзер перепрыгнул в другой фрагмент сообщений
        return store.commit('messages/addSelectedMessage', props.msg.id);
      }

      const list = (
        props.msg.id > lastSelectedId
          ? messages.slice(lastSelectedIndex + 1, msgIndex + 1)
          : messages.slice(msgIndex, lastSelectedIndex).reverse()
      ).filter((msg) => (
        !msg.action &&
        !msg.isExpired &&
        !msg.attachments.call &&
        !state.selectedMessages.includes(msg.id)
      )).map((msg) => msg.id);

      for (const id of list) {
        store.commit('messages/addSelectedMessage', id);
      }
    }

    function onMouseMove() {
      if (timer) {
        state.bubble.removeEventListener('mousemove', onMouseMove);
        clearTimeout(timer);
        timer = null;
      }
    }

    function updateState({ key, value }) {
      state[key] = value;
    }

    onMounted(() => {
      if (state.forwarded && props.isCustomView) {
        state.fwdOverflow = state.forwarded.$el.clientWidth > state.bubble.clientWidth;
      }
    });

    return {
      ...toRefs(state),

      onMouseDown,
      onMouseMove,
      updateState
    };
  }
};
</script>

<style>
.message {
  display: flex;
  background-color: var(--background);
  user-select: text;
}

.message.isSelectMode {
  user-select: none;
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

.message_name {
  color: var(--text-blue);
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 2px;
}

.message.isSelectMode .message_bubble {
  cursor: pointer;
}

/* Блокируем все кликабельные элементы во время выделения */
.message.isSelectMode .message_bubble > * {
  pointer-events: none;
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

.message.hideBubble.isDisappearing:not(.out) .message_bubble {
  /* Отступ справа нужен для того, чтобы иконка исчезающего сообщения не залезала на время */
  margin-right: 5px;
}

.message_bubble::before,
.message_bubble::after {
  --unread-offset: 0px;
}

.message.hideBubble.isDisappearing:not(.out) .message_bubble::after {
  --unread-offset: 5px;
}

.message_text {
  display: inline;
  line-height: 18px;
}

.message.hasAttachment .message_text:not(:empty) {
  display: block;
  margin-bottom: 5px;
}

.message_text.isContentDeleted {
  color: var(--text-dark-steel-gray);
}

/* Message time wrap =================================== */

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

.message.flyTime .message_time_wrap {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: var(--background-alpha);
  border-radius: 9px;
  padding: 2px 6px;
  width: fit-content;
}

.message.isSticker:not(.hideBubble) .message_time_wrap,
.message.flyTime.hideBubble:not(.isSticker) .message_time_wrap {
  right: 4px;
  bottom: 4px;
}

.message.isSticker:not(.hideBubble).out .message_time_wrap {
  background-color: var(--message-out-bubble-background-alpha);
}

.message.isSticker:not(.hideBubble):not(.out) .message_time_wrap {
  background-color: var(--message-bubble-background-alpha);
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

/* Unread dot ========================================== */

.message.isUnread.out .message_bubble::before,
.message.isUnread:not(.out) .message_bubble::after {
  position: absolute;
  width: 8px;
  height: 8px;
  bottom: 12px;
  border-radius: 50%;
  background-color: var(--background-blue-overlight);

  --offset: calc(-16px - var(--unread-offset));
}

.message:not(.isLoading).isUnread.out .message_bubble::before {
  content: '';
  left: var(--offset);
}

.message.isUnread:not(.out) .message_bubble::after {
  content: '';
  right: var(--offset);
}

/* Expire time ========================================= */

/* 1. mm:ss */

.message.isUnread.out.isDisappearing .message_bubble::before,
.message.isUnread:not(.out).isDisappearing .message_bubble::after {
  --offset: calc(-47px - var(--unread-offset));
}

/* 2. hhч */

.message.isUnread.out.isDisappearing.expireHours .message_bubble::before,
.message.isUnread:not(.out).isDisappearing.expireHours .message_bubble::after {
  --offset: calc(-34px - var(--unread-offset));
}

/* 3. icon */

.message.isUnread.out.isDisappearing.expireIcon .message_bubble::before,
.message.isUnread:not(.out).isDisappearing.expireIcon .message_bubble::after {
  --offset: calc(-32px - var(--unread-offset));
}

/* Select mark ========================================= */

.message.out.isSelected .message_bubble::after,
.message:not(.out).isSelected .message_bubble::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, .12);
  border-radius: 18px;
  top: 0;
  left: 0;
  z-index: 1;
}

/* Ограничение ширины сообщения со стикером ============ */
.message:not(.hideBubble).isSticker .attach_reply,
.message:not(.hideBubble).isSticker .message_text {
  width: 128px;
}
</style>
