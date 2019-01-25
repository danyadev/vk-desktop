<template>
  <div class="message_attach attach_reply_msg">
    <img v-if="photo" :src="photo" class="attach_reply_msg_photo"/>
    <div class="attach_reply_msg_content">
      <div class="attach_reply_msg_name">{{ name }}</div>
      <div class="attach_reply_msg_text message_content_deleted"
           v-if="isDeletedContent">({{ l('content_deleted') }})</div>
      <div v-else class="attach_reply_msg_text" v-emoji.push
           :class="{ isAttach }">{{ text }}</div>
    </div>
  </div>
</template>

<script>
  const { getMessagePreview, parseMessage, isDeletedContent } = require('./../messages/methods');

  module.exports = {
    props: ['data'],
    computed: {
      msg() {
        return parseMessage(this.data);
      },
      author() {
        return this.$store.state.profiles[this.msg.from];
      },
      photo() {
        let photo = this.msg.attachments.find((attach) => attach.type == 'photo');

        if(photo) {
          return photo.photo.sizes.find((size) => size.type == 'o').url;
        }
      },
      name() {
        return this.author.name || `${this.author.first_name} ${this.author.last_name}`;
      },
      text() {
        return getMessagePreview(this.msg, this.author);
      },
      isAttach() {
        if(this.msg.text) return false;

        return this.msg.attachments.length || this.msg.isReplyMsg || this.msg.fwdCount;
      },
      isDeletedContent() {
        return isDeletedContent(this.msg);
      }
    }
  }
</script>
