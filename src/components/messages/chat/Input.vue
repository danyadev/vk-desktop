<template>
  <div class="chat_input_container">
    <template v-if="canWrite.allowed">
      <div class="chat_input_wrap">
        <img class="attachments_btn" src="~assets/attachments_icon.svg">
        <div :class="['chat_input', { hasKeyboard }]">
          <div class="chat_input_area"
               role="textbox"
               ref="input"
               contenteditable
               :placeholder="l('im_input_placeholder')"
               @input="onInput"
               @drop.prevent
               @paste.prevent="paste"
               @keydown.enter.exact.prevent="sendMessage()"
          ></div>
          <Icon v-if="hasKeyboard"
                name="keyboard"
                :color="showKeyboard ? '#528bcc' : '#828a99'"
                :class="['keyboard_btn', { active: showKeyboard }]"
                @click.native="showKeyboard = !showKeyboard"
          />
          <img class="emoji_btn" src="~assets/emoji_icon.svg">
        </div>
        <img class="send_btn" src="~assets/im_send.svg" @click="sendMessage()">
      </div>
      <Keyboard v-if="hasKeyboard && showKeyboard" :keyboard="keyboard" @click="sendMessage" />
    </template>
    <Ripple v-else-if="canWrite.channel" class="chat_input_error channel" color="#e1e5f0" @click="toggleNotifications">
      <template v-if="peer.left">
        <img src="~assets/plus.svg">
        {{ l('im_toggle_left_state', 3) }}
      </template>
      <template v-else>
        <img :src="`assets/volume_${peer.muted ? 'active' : 'muted'}.svg`">
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
  import electron from 'electron';
  import { getTextWithEmoji, getLastMsgId } from 'js/messages';
  import { random, throttle, escape, eventBus } from 'js/utils';
  import emoji from 'js/emoji';
  import vkapi from 'js/vkapi';

  import Icon from '../../UI/Icon.vue';
  import Ripple from '../../UI/Ripple.vue';
  import Keyboard from './Keyboard.vue';

  export default {
    props: ['peer_id', 'peer'],
    components: {
      Icon,
      Ripple,
      Keyboard
    },
    data: () => ({
      showKeyboard: true,
      counter: 0
    }),
    computed: {
      canWrite() {
        if(this.peer && this.peer.canWrite) {
          return { allowed: true };
        } else {
          return {
            allowed: false,
            text: this.peer ? this.l('im_chat_cant_write') : this.l('loading'),
            channel: this.peer ? this.peer.channel : false
          };
        }
      },
      keyboard() {
        return this.peer && this.peer.keyboard || {};
      },
      hasKeyboard() {
        return (this.keyboard.buttons || []).length;
      }
    },
    methods: {
      async sendMessage(action, author_id) {
        const random_id = random(-2e9, 2e9);
        let text;

        if(action) {
          const { screen_name } = this.$store.state.profiles[author_id];

          text = this.peer_id > 2e9 ? `@${screen_name} ${action.label}` : action.label;

          if(this.keyboard.one_time) {
            this.$store.commit('messages/updateConversation', {
              peer: {
                id: this.peer_id,
                keyboard: {}
              }
            });
          }
        } else {
          text = getTextWithEmoji(this.$refs.input.childNodes);
        }

        if(!text) return;

        this.$refs.input.innerHTML = '';
        this.counter++;

        try {
          this.$store.commit('messages/addLoadingMessage', {
            peer_id: this.peer_id,
            msg: {
              id: getLastMsgId() + this.counter*1e5,
              text,
              from: this.$store.getters['users/user'].id,
              date: (Date.now() / 1000).toFixed(),
              out: true,
              editTime: 0,
              fwdCount: 0,
              fwdMessages: [],
              attachments: [],
              random_id,
              isLoading: true
            }
          });

          await this.$nextTick();

          eventBus.emit('messages:jumpTo', {
            peer_id: this.peer_id,
            bottom: true,
            mark: false
          });

          await vkapi('messages.send', {
            peer_id: this.peer_id,
            message: text,
            random_id,
            payload: action && action.payload
          });
        } catch(e) {
          this.$store.commit('messages/editLoadingMessage', {
            peer_id: this.peer_id,
            random_id,
            isLoadingFailed: true
          });

          // 900 = Нельзя отправить пользователю из черного списка
          // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
          if([900, 902].includes(e.error_code)) {
            this.$store.commit('messages/updateConversation', {
              peer: {
                id: this.peer_id,
                canWrite: false
              }
            });
          }
        }
      },

      toggleNotifications() {
        if(this.peer.left) {
          vkapi('messages.addChatUser', {
            chat_id: this.peer_id - 2e9,
            user_id: this.$store.getters['users/user'].id
          });
        } else {
          vkapi('account.setSilenceMode', {
            peer_id: this.peer_id,
            time: this.peer.muted ? 0 : -1
          });
        }
      },

      paste() {
        const text = escape(electron.remote.clipboard.readText()).replace(/\n/g, '<br>');

        document.execCommand('insertHTML', false, emoji(text));
      },

      onInput: throttle(function(e) {
        if(e.data && this.$store.state.settings.messagesSettings.typing) {
          vkapi('messages.setActivity', {
            peer_id: this.peer_id,
            type: 'typing'
          });
        }
      }, 4000)
    },
    activated() {
      if(this.$refs.input) this.$refs.input.focus();
    }
  }
</script>

<style>
  .chat_input_container {
    display: flex;
    flex-direction: column;
    flex: none;
    border-top: 1px solid #d8dade;
    background: #fbfbfb;
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
    background: #fff;
    border: 1px solid #d2d8dc;
    border-radius: 20px;
  }

  .chat_input_area {
    color: #222;
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
    color: #828282;
    cursor: text;
  }

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

  .emoji_btn { right: 8px }
  .keyboard_btn { right: 36px }
  .keyboard_btn.active { opacity: .9 }

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
    color: #3e3f40;
  }

  .chat_input_error.channel {
    color: #3f70a7;
    user-select: none;
    cursor: pointer;
    transition: background-color .2s;
  }

  .chat_input_error.channel img {
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
