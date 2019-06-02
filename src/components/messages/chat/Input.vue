<template>
  <div class="chat_input_container">
    <template v-if="canWrite.allowed">
      <img class="attachments_btn" src="~assets/attachments_icon.svg">
      <div class="chat_input_wrap">
        <div class="chat_input"
             role="textbox"
             ref="input"
             contenteditable
             :placeholder="l('im_input_placeholder')"
             @input="onInput($event, id)"
             @drop.prevent
             @paste.prevent="paste"
             @keydown.enter.exact.prevent="sendMessage"
        ></div>
        <img class="emoji_btn" src="~assets/emoji_icon.svg">
      </div>
      <img class="send_btn" src="~assets/im_send.svg" @click="sendMessage">
    </template>
    <Ripple v-else-if="canWrite.channel" class="chat_input_error channel" color="#e1e5f0" @click="toggleNotifications">
      <img :src="`assets/volume_${peer.muted ? 'active' : 'muted'}.svg`">
      {{ l('im_toggle_notifications', !peer.muted) }}
    </Ripple>
    <div v-else class="chat_input_error ff-roboto">
      <div class="chat_input_error_img"></div>
      <div class="chat_input_error_text">{{ canWrite.text }}</div>
    </div>
  </div>
</template>

<script>
  import { remote as electron } from 'electron';
  import { getTextWithEmoji } from 'js/messages';
  import { random, throttle } from 'js/utils';
  import store from 'js/store/';
  import emoji from 'js/emoji';
  import vkapi from 'js/vkapi';
  import Ripple from '../../UI/Ripple.vue';

  const { clipboard } = electron;

  export default {
    props: ['id', 'peer'],
    components: {
      Ripple
    },
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
      }
    },
    methods: {
      async sendMessage() {
        const { text } = getTextWithEmoji(this.$refs.input.childNodes);
        const random_id = random(0, 9e8);

        if(!text) return;
        this.$refs.input.innerHTML = '';

        try {
          await vkapi('messages.send', {
            peer_id: this.id,
            message: text,
            random_id: random_id
          });

          store.commit('messages/addLoadingMessage', {
            peer_id: this.id,
            random_id: random_id
          });
        } catch(data) {
          console.error(data);
        }
      },
      toggleNotifications() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peer.id,
          time: this.peer.muted ? 0 : -1
        });
      },
      paste() {
        const text = clipboard.readText().replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, emoji(text));
      },
      onInput: throttle((e, id) => {
        if(!e.data) return;

        vkapi('messages.setActivity', {
          peer_id: id,
          type: 'typing'
        });
      }, 1500)
    },
    activated() {
      const { input } = this.$refs;
      if(input) input.focus();
    }
  }
</script>

<style>
  .chat_input_container {
    display: flex;
    flex: none;
    border-top: 1px solid #d8dade;
    background-color: #fbfbfb;
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

  .chat_input_wrap {
    position: relative;
    width: calc(100% - 108px);
    margin: 6px 0;
    background-color: #fff;
    border: 1px solid #d2d8dc;
    border-radius: 20px;
  }

  .chat_input {
    color: #222;
    min-height: 18px;
    max-height: 180px;
    line-height: 18px;
    padding: 10px 35px 10px 13px;
    overflow-x: auto;
  }

  .chat_input::-webkit-scrollbar {
    display: none;
  }

  .chat_input:empty::before {
    content: attr(placeholder);
    color: #828282;
    cursor: text;
  }

  .emoji_btn {
    position: absolute;
    bottom: 7px;
    right: 8px;
    opacity: .7;
    cursor: pointer;
    transition: opacity .3s;
  }

  .emoji_btn:hover { opacity: 1 }
  .emoji_btn:active { transform: translateY(1px) }

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
    -webkit-mask-size: 36px;
    -webkit-mask-image: url('~assets/im_chat_error.png');
    background-color: #f3690b;
  }

  .chat_input_error_text {
    margin-left: 10px;
  }
</style>
