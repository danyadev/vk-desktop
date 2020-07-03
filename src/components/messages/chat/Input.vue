<template>
  <div class="chat_input_container border-top-shadow">
    <template v-if="canWrite.allowed">
      <div v-if="repliedMsg || fwdMessages.length" class="chat_input_reply">
        <Reply v-if="repliedMsg" :peer_id="peer_id" :msg="repliedMsg" :ownerMsgId="repliedMsg.id" />
        <div v-else class="attach_reply attach_left_border" @click="openFwdMessages">
          <div class="attach_reply_content">
            <div class="attach_reply_name">{{ l('im_forwarded_some') }}</div>

            <div class="attach_reply_text hasAttachment">
              {{ l('im_forwarded', [fwdMessages.length], fwdMessages.length) }}
            </div>
          </div>
        </div>

        <Icon
          name="cancel"
          color="var(--icon-dark-gray)"
          width="26"
          height="26"
          class="icon-hover"
          @click="closeReply"
        />
      </div>

      <div class="chat_input_wrap">
        <img class="attachments_btn icon-hover" src="~assets/attachments_icon.svg">

        <div :class="['chat_input', { hasKeyboard }]">
          <div
            ref="input"
            class="chat_input_area"
            role="textbox"
            contenteditable
            spellcheck
            :placeholder="l('im_input_placeholder')"
            @input="onInput"
            @drop.prevent
            @paste.prevent="paste"
            @keydown.enter.exact.prevent="send"
            @mousedown="setCaretForEmoji"
          ></div>

          <Icon
            v-if="hasKeyboard"
            name="keyboard"
            :color="showKeyboard ? 'var(--accent)' : 'var(--icon-dark-gray)'"
            :class="['keyboard_btn icon-hover', { active: showKeyboard }]"
            @click="showKeyboard = !showKeyboard"
          />

          <img class="emoji_btn icon-hover" src="~assets/emoji_icon.svg">
        </div>

        <img class="send_btn icon-hover" src="~assets/im_send.svg" @click="send">
      </div>

      <Keyboard v-if="hasKeyboard && showKeyboard" :peer_id="peer_id" :keyboard="keyboard" />
    </template>

    <Ripple
      v-else-if="canWrite.isChannel"
      color="var(--messages-peer-active)"
      class="chat_input_error isChannel"
      @click="toggleNotifications"
    >
      <template v-if="peer.left">
        <Icon name="plus" color="var(--icon-blue)" />
        {{ l('im_toggle_left_state', 3) }}
      </template>
      <template v-else>
        <Icon :name="peer.muted ? 'volume_active' : 'volume_muted'" color="var(--icon-blue)" />
        {{ l('im_toggle_notifications', !peer.muted) }}
      </template>
    </Ripple>

    <div v-else class="chat_input_error">
      <img class="chat_input_error_img" src="~assets/error.svg">
      <div class="chat_input_error_text">{{ canWrite.text }}</div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted, watch } from 'vue';
import electron from 'electron';
import { throttle, escape } from 'js/utils';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
import emoji, { isEmoji } from 'js/emoji';
import getTranslate from 'js/getTranslate';
import sendMessage from 'js/sendMessage';

import Icon from '../../UI/Icon.vue';
import Ripple from '../../UI/Ripple.vue';
import Keyboard from './Keyboard.vue';
import Reply from './attachments/Reply.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Icon,
    Ripple,
    Keyboard,
    Reply
  },

  setup(props) {
    const state = reactive({
      input: null,
      route: router.currentRoute,
      keyboard: computed(() => props.peer && props.peer.keyboard || {}),
      hasKeyboard: computed(() => (state.keyboard.buttons || []).length),
      showKeyboard: false,

      canWrite: computed(() => {
        if (props.peer && props.peer.isWriteAllowed) {
          return { allowed: true };
        }

        return {
          allowed: false,
          isChannel: props.peer && props.peer.isChannel,
          text: props.peer ? getTranslate('im_chat_cant_write') : getTranslate('loading')
        };
      }),

      repliedMsg: computed(() => store.state.messages.repliedMessages[props.peer_id]),
      fwdMessages: computed(() => (
        store.state.messages.forwardedMessages[props.peer_id] || []
      ).sort((a, b) => a.id - b.id))
    });

    function toggleNotifications() {
      if (props.peer.left) {
        vkapi('messages.addChatUser', {
          chat_id: props.peer_id - 2e9,
          user_id: store.state.users.activeUser
        });
      } else {
        vkapi('account.setSilenceMode', {
          peer_id: props.peer_id,
          time: props.peer.muted ? 0 : -1
        });
      }
    }

    function paste(pasteText) {
      const text = escape(
        typeof pasteText === 'string'
          ? pasteText
          : electron.remote.clipboard.readText()
      ).replace(/\n/g, '<br>');

      document.execCommand('insertHTML', false, emoji(text));
    }

    async function send() {
      const reply_to = state.repliedMsg && state.repliedMsg.id;

      // Функция не ждет отсылки сообщения через API.
      // Асинхронная функция потому, что там вызывается await nextTick();
      // isSended означает, что сообщение содержит необходимую для отправки информацию
      // и можно очищать поле ввода и удалять весь вложенный в инпут контент
      const isSended = await sendMessage({
        peer_id: props.peer_id,
        input: state.input,
        reply_to,
        fwdMessages: state.fwdMessages
      });

      if (isSended && (reply_to || state.fwdMessages.length)) {
        closeReply();
      }
    }

    function preventInputEvent(event) {
      const range = new Range();
      const sel = window.getSelection();

      const node = [...state.input.childNodes].find((el) => el === sel.anchorNode);
      const emojiIndex = node.data.indexOf(event.data);

      range.setStart(node, emojiIndex);
      range.setEnd(node, emojiIndex + event.data.length);

      if (!sel.isCollapsed) {
        // Удаляем уже выделенный ранее текст
        document.execCommand('delete');
      }

      // Создаем свое выделение
      sel.removeAllRanges();
      sel.addRange(range);

      // Удаляем выделенный текст
      document.execCommand('delete');
    }

    function onInput(event) {
      if (!event.data) {
        return;
      }

      if (isEmoji(event.data)) {
        preventInputEvent(event);
        paste(event.data);
      }

      if (store.getters['settings/settings'].typing && props.peer_id !== 100) {
        sendTyping();
      }
    }

    const sendTyping = throttle(() => {
      vkapi('messages.setActivity', {
        peer_id: props.peer_id,
        type: 'typing'
      }).catch(() => {});
    }, 4000);

    function setCaretForEmoji(event) {
      if (event.target.tagName !== 'IMG') {
        return;
      }

      const range = new Range();
      const sel = window.getSelection();

      range.selectNode(event.target);
      range.collapse(event.offsetX <= 8);

      sel.removeAllRanges();
      sel.addRange(range);
    }

    function closeReply() {
      store.commit('messages/removeRepliedMessage', props.peer_id);
      store.state.messages.forwardedMessages[props.peer_id] = [];
    }

    function openFwdMessages() {
      store.commit('messages/openMessagesViewer', {
        messages: state.fwdMessages,
        peer_id: +state.route.params.fromId || props.peer_id
      });
    }

    // TODO onActivated
    onMounted(() => {
      state.input && state.input.focus();
    });

    watch([() => state.repliedMsg, () => state.fwdMessages], ([msg, fwd], [prevMsg, prevFwd]) => {
      if (
        msg !== prevMsg && msg ||
        fwd !== prevFwd && fwd.length
      ) {
        state.input.focus();
      }
    });

    return {
      ...toRefs(state),

      toggleNotifications,
      paste,
      send,
      onInput,
      setCaretForEmoji,
      closeReply,
      openFwdMessages
    };
  }
};
</script>

<style>
.chat_input_container {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: none;
  border-top: 1px solid var(--separator-dark);
  background: var(--background-gray-overlight);
}

.chat_input_wrap {
  display: flex;
  flex-direction: row;
}

.attachments_btn, .send_btn {
  box-sizing: content-box;
  margin-top: auto;
  padding: 14px 15px;
  width: 24px;
  height: 24px;
}

.chat_input {
  position: relative;
  width: calc(100% - 108px);
  margin: 6px 0;
  background: var(--background);
  border: 1px solid var(--separator-dark);
  border-radius: 20px;
}

.chat_input_area {
  color: var(--field-color);
  min-height: 18px;
  max-height: 180px;
  line-height: 18px;
  padding: 10px 35px 10px 13px;
  overflow-x: auto;
}

.chat_input_area::-webkit-scrollbar {
  display: none;
}

.chat_input_area:empty::before {
  content: attr(placeholder);
  color: var(--field-placeholder);
  cursor: text;
}

.chat_input_area b { font-weight: normal }
.chat_input_area i { font-style: normal }
.chat_input_area u { text-decoration: none }

.chat_input.hasKeyboard .chat_input_area {
  padding-right: 68px;
}

.emoji_btn, .keyboard_btn {
  position: absolute;
  bottom: 7px;
}

.emoji_btn {
  right: 8px;
}

.keyboard_btn {
  right: 36px;
}

.keyboard_btn.active {
  opacity: .9;
}

.emoji_btn:active, .keyboard_btn:active {
  transform: translateY(1px);
}

.chat_input_error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  color: var(--text-gray);
}

.chat_input_error.isChannel {
  color: var(--text-blue-light);
  cursor: pointer;
  transition: background-color .2s;
}

.chat_input_error.isChannel svg {
  margin-right: 8px;
}

.chat_input_error_img {
  width: 36px;
  height: 36px;
}

.chat_input_error_text {
  margin-left: 10px;
}

.chat_input_reply {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--separator-dark);
}

.chat_input_reply .attach_reply {
  margin: 6px 0 8px 10px;
  width: calc(100% - 10px - 54px);
}

.chat_input_reply svg {
  flex: none;
  margin: 0 14px;
  cursor: pointer;
}
</style>
