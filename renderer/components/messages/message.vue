<template>
 <div class="message" :id="'message' + this.msg.id" :class="{ from_me: isOwner, first_msg_block: isFirstMsg }">
   <img v-if="showUserData" class="message_photo" :src="photo">
   <div v-else-if="isChat && !peer.channel" class="message_empty_photo"></div>
   <div class="message_content" :class="{ outread }">
     <div class="message_name" v-if="showUserData">{{ name }}</div>
     <div class="message_text_wrap">
       <div class="message_text" v-emoji.color_push.br.link>{{ text.msg }}</div>
       <div class="message_attachments" :class="{ hasText: !!text.msg }">
         <div class="message_attach" v-for="attach in text.attachments">
           <img class="message_attach_img" src="images/im_attachment.png">
           <div class="message_attach_content">
             <div class="message_attach_title">Вложение</div>
             <div class="message_attach_desc">{{ attach.type }}</div>
          </div>
         </div>
       </div>
       <div class="message_time_wrap">
         <template v-if="msg.edited">
           <div class="message_edited">ред</div>
           <div class="dot"></div>
         </template>
         <div class="message_time">{{ time }}</div>
       </div>
     </div>
  </div>
 </div>
</template>

<script>
  const { loadProfile } = require('./methods');

  module.exports = {
    props: {
      msg: {
        type: Object,
        required: true
      },
      peer: {
        type: Object,
        required: true
      }
    },
    computed: {
      isChat() {
        return this.peer.id > 2e9;
      },
      isFirstMsg() {
        let messages = this.$store.state.messages[this.peer.id],
            msgIndex = messages.findIndex(({ id }) => id == this.msg.id),
            prevMsg = messages[msgIndex - 1];

        return !prevMsg || prevMsg.from != this.msg.from;
      },
      showUserData() {
        if(!this.isFirstMsg || this.isOwner || !this.isChat || this.peer.channel) return false;
        else return true;
      },
      isOwner() {
        return this.msg.from == this.$root.user.id;
      },
      user() {
        let user = this.$store.state.profiles[this.msg.from];
        if(!user || !user.photo_50) loadProfile(this.msg.from);

        return user || {};
      },
      photo() {
        return this.user.photo_50;
      },
      name() {
        let userName = this.user.photo_50 ? `${this.user.first_name} ${this.user.last_name}` : '...';

        return this.user.name || userName;
      },
      supportedAttachments() {
        return [];
      },
      text() {
        let arr = new Array(this.msg.fwd_count).fill(1),
            fwdMessages = arr.map(() => ({ type: 'Пересланное сообщение' }));

        return {
          msg: this.msg.text,
          attachments: this.msg.attachments.concat(fwdMessages)
        }
      },
      outread() {
        return this.msg.outread;
      },
      time() {
        let date = new Date(this.msg.date * 1000),
            f = (t) => t < 10 ? `0${t}` : t;

        return `${date.getHours()}:${f(date.getMinutes())}`;
      }
    }
  }
</script>
