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
        ></div>
        <img class="emoji_btn" src="~assets/emoji_icon.svg">
      </div>
      <img class="send_btn" src="~assets/im_send.svg">
    </template>
    <Ripple v-else-if="canWrite.channel" class="chat_input_error channel" color="#e1e5f0">
      <img :src="`assets/volume_${peer.muted ? 'active' : 'muted'}.svg`">
      {{ l('toggle_notifications', !peer.muted) }}
    </Ripple>
    <div v-else class="chat_input_error">
      <div class="chat_input_error_img"></div>
      <div class="chat_input_error_text">{{ canWrite.text }}</div>
    </div>
    </div>
  </div>
</template>

<script>
  import Ripple from '../../UI/Ripple.vue';

  export default {
    props: ['peer'],
    components: {
      Ripple
    },
    computed: {
      canWrite() {
        if(this.peer && this.peer.canWrite.allowed) {
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
    padding: 14px 15px;
    width: 24px;
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
    font-family: Roboto;
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
