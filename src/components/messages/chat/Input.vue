<template>
  <div class="chat_input_container">
    <template v-if="canWrite.allowed">
      <div class="chat_input_wrap">
        <img class="attachments_btn" src="~assets/attachments_icon.svg">

        <div :class="['chat_input', { hasKeyboard }]">
          <div
            ref="input"
            class="chat_input_area"
            role="textbox"
            contenteditable
            :placeholder="l('im_input_placeholder')"
            @input="onInput"
            @drop.prevent
            @paste.prevent="paste"
            @keydown.enter.exact.prevent="send"
          ></div>

          <img class="emoji_btn" src="~assets/emoji_icon.svg">
        </div>

        <img class="send_btn" src="~assets/im_send.svg" @click="send">
      </div>
    </template>
    <Ripple
      v-else-if="canWrite.channel"
      color="var(--messages-peer-ripple)"
      class="chat_input_error channel"
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
import { reactive, computed, toRefs, onMounted } from 'vue';
import electron from 'electron';
import { throttle, escape } from 'js/utils';
import emoji from 'js/emoji';
import vkapi from 'js/vkapi';
import store from 'js/store';
import getTranslate from 'js/getTranslate';

import Icon from '../../UI/Icon.vue';
import Ripple from '../../UI/Ripple.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Icon,
    Ripple
  },

  setup(props) {
    const state = reactive({
      input: null,
      keyboard: computed(() => props.peer && props.peer.keyboard || {}),
      hasKeyboard: computed(() => (state.keyboard.buttons || []).length),
      showKeyboard: false,

      canWrite: computed(() => {
        if (props.peer && props.peer.canWrite) {
          return { allowed: true };
        }

        return {
          allowed: false,
          text: props.peer ? getTranslate('im_chat_cant_write') : getTranslate('loading'),
          channel: props.peer && props.peer.channel
        };
      })
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

    function paste() {
      const text = escape(electron.remote.clipboard.readText()).replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, emoji(text));
    }

    function send() {
      // TODO
    }

    const onInput = throttle((event) => {
      if (event.data && store.getters['settings/settings'].typing && props.peer_id !== 100) {
        vkapi('messages.setActivity', {
          peer_id: props.peer_id,
          type: 'typing'
        }).catch(() => {});
      }
    }, 4000);

    // TODO onActivated
    onMounted(() => {
      if (state.input) {
        state.input.focus();
      }
    });

    return {
      ...toRefs(state),

      toggleNotifications,
      paste,
      send,
      onInput
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
  background: var(--gray-background-overlight);
}

.chat_input_container::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 0;
  left: 0;
  z-index: 1;
  height: 4px;
  margin-bottom: 1px;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, .03) 75%, rgba(0, 0, 0, .06));
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
  opacity: .7;
  cursor: pointer;
  transition: opacity .3s;
}

.attachments_btn:hover, .send_btn:hover {
  opacity: 1;
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
  opacity: .7;
  cursor: pointer;
  transition: opacity .3s;
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

.emoji_btn:hover, .keyboard_btn:hover {
  opacity: 1;
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

.chat_input_error.channel {
  color: var(--text-blue-light);
  cursor: pointer;
  transition: background-color .2s;
}

.chat_input_error.channel svg {
  margin-right: 8px;
}

.chat_input_error_img {
  width: 36px;
  height: 36px;
}

.chat_input_error_text {
  margin-left: 10px;
}
</style>
