<template>
  <div class="chat_input_container">
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
  </div>
</template>

<script>
  export default {
    activated() {
      this.$refs.input.focus();
    }
  }
</script>

<style scoped>
  .chat_input_container {
    position: relative;
    display: flex;
    align-items: flex-end;
    flex: none;
    border-top: 1px solid #e7e8ec;
    background-color: #fafbfc;
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
</style>
